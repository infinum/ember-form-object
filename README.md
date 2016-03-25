# Ember Form Object

Form object pattern in Ember apps (similar to ActiveModel Form Objects in Ruby on Rails)

## Features

* Declarative validations (depends on [ember-validations](https://github.com/DockYard/ember-validations) under the hood)
* Merge client & server side validation errors
* Properties proxied to / synced from model
* Virtual & async properties
* Well defined form save (submit) process with appropriate hooks
* Manage form "dirty", "loaded" and "submiting" state
* Prevent form loss with confirmation when leaving dirty form
* Add/remove properties in runtime (useful for dynamic forms)

## Installation

```javascript
ember install ember-form-object
```

## Example usage

##### Form object for todo model
```javascript
// app/forms/todo.js

import Ember from 'ember';
import ModelFormObject from 'ember-form-object/forms/model-form';

export default ModelFormObject.extend({
  properties: {
    'title': { validate: { presence: true } },
    'completed': {},
    'assignee': {},
    'subscribers': { async: true },
    'description': { virtual: true, validate: { presence: true } },
    'people': { virtual: true, async: true }
  },

  setDescription() {
    return this.get('model.description');
  },

  syncDescription() {
    const parsedDescription = Ember.String.capitalize(this.get('description').trim());
    this.set('model.description', parsedDescription);
  },

  beforeSubmit() {
    this._super(...arguments);
  },

  afterSubmit() {
    this._super(...arguments);
    this.set('description', this.setDescription());
    this.setAllPropertiesDirtyFlag(false);
  }
});
```

##### Route with form route mixin (which instantiates todo form object)
```javascript
import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';
import TodoForm from '../../forms/todo';

export default Ember.Route.extend(FormRouteMixin, {
  formClass: TodoForm,

  model(params) {
    return this.store.peekRecord('todo', params.id);
  },

  afterModel() {
    this._super(...arguments);
    this.set('modelForm.people', this.store.peekAll('user'));
  },

  actions: {
    saveModelForm() {
      this.get('modelForm').save();
    }
  }
});
```

##### Non-model form object usage (login form)
```javascript
import Ember from 'ember';
import BaseForm from 'ember-form-object/forms/base-form';

export default BaseForm.extend({
  properties: {
    'email': {
      value: '',
      validate: { presence: true }
    },
    'password': {
      value: '',
      validate: { presence: true }
    },
    'rememberMe': {
      value: false
    }
  },

  submit() {
    const credentials = this.getProperties('email', 'password');
    // This is mocked, you should actually login here :)
    return new Ember.RSVP.Promise((resolve) => setTimeout(() => resolve(credentials), 1000));
  }
});

```

## Disclaimer

This project is currently in **alpha** state. Public API of the library is still under active development.

## Development

### TODOs (by priority)
* Example page & docs
* Use ember dependency injection to load form classes
* Remove lodash dependency
* Get rid of "container" deprecation warning when instantiating form object
* Better test coverage
* Remove form-loss feature from route mixin and just add it as an example
* Add blueprints for ember-cli

### Setup development environment

* `git clone` this repository
* `npm install`
* `bower install`

### Running dummy app

* `ember server`
* Visit your app at http://localhost:4200.

### Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Authors ##

* [Ivan Lučin](http://github.com/ilucin)
* [Jan Varljen](http://github.com/janvarljen)

## Want to help? ##

Contributors welcome.

## Legal ##

[Infinum LTD](http://infinum.co) &copy; 2016

[@infinumco](http://twitter.com/infinumco)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)
