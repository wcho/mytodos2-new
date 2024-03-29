/*global define, window */

define([
    '/webida.js',
	'knockout',
	'config/global',
	'models/Todo'
], function (webida, ko, g, Todo) {
	'use strict';

	// our main view model
	var ViewModel = function (todos) {
		var self = this;

		// map array of passed in todos to an observableArray of Todo objects
		self.todos = ko.observableArray(ko.utils.arrayMap(todos, function (todo) {
			return new Todo(todo.title, todo.completed);
		}));

		// store the new todo value being entered
		self.current = ko.observable();

		// add a new todo, when enter key is pressed
		self.add = function () {
			var current = self.current().trim();

			if (current) {
				self.todos.push(new Todo(current));
				self.current('');
			}
		};

		// remove a single todo
		self.remove = function (todo) {
			self.todos.remove(todo);
		};

		// remove all completed todos
		self.removeCompleted = function () {
			self.todos.remove(function (todo) {
				return todo.completed();
			});
		};

		// edit an item
		self.editItem = function (item) {
			item.editing(true);
		};

		// stop editing an item.  Remove the item, if it is now empty
		self.stopEditing = function (item) {
			item.editing(false);

			if (!item.title().trim()) {
				self.remove(item);
			}
		};

		// count of all completed todos
		self.completedCount = ko.computed(function () {
			return ko.utils.arrayFilter(self.todos(), function (todo) {
				return todo.completed();
			}).length;
		});

		// count of todos that are not complete
		self.remainingCount = ko.computed(function () {
			return self.todos().length - self.completedCount();
		});

		// writeable computed observable to handle marking all complete/incomplete
		self.allCompleted = ko.computed({
			//always return true/false based on the done flag of all todos
			read: function () {
				return !self.remainingCount();
			},
			// set all todos to the written value (true/false)
			write: function (newValue) {
				ko.utils.arrayForEach(self.todos(), function (todo) {
					// set even if value is the same, as subscribers are not notified in that case
					todo.completed(newValue);
				});
			}
		});

		// helper function to keep expressions out of markup
		self.getLabel = function (count) {
			return ko.utils.unwrapObservable(count) === 1 ? 'item' : 'items';
		};

       	var dataPath = webida.fs.getFsPathFromPathname(window.location.pathname) + '/data.json';
    	var approot = webida.fs.mount(window.location.href);

		// internal computed observable that fires whenever anything changes in our todos
		ko.computed(function () {
            approot.writeFile(dataPath, null, ko.toJSON(self.todos), function () {});
		}).extend({
			throttle: 200
		}); // save at most twice per second
	};

	return ViewModel;
});
