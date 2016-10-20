# Ember Form Object

[![Build Status](https://semaphoreci.com/api/v1/ilucin/ember-form-object/branches/master/shields_badge.svg)](https://semaphoreci.com/ilucin/ember-form-object)
[![Code Climate](https://codeclimate.com/github/infinum/ember-form-object/badges/gpa.svg)](https://codeclimate.com/github/infinum/ember-form-object)
[![Ember Observer Score](https://emberobserver.com/badges/ember-form-object.svg)](https://emberobserver.com/addons/ember-form-object)
[![npm version](https://badge.fury.io/js/ember-form-object.svg)](http://badge.fury.io/js/ember-form-object)

Form object pattern in Ember apps (similar to ActiveModel Form Objects in Ruby on Rails)

## Features

* Declarative validations (depends on [ember-validations](https://github.com/DockYard/ember-validations) under the hood)
* Handles client & server side validation errors
* Properties proxied to / synced from model
* Virtual, async & readonly properties
* Well defined form save (submit) process with appropriate hooks
* Manage form "dirty", "loaded", "submitting" and "valid" state
* Prevent form loss with confirmation when leaving dirty form
* Add/remove properties in runtime (useful for dynamic forms)
* Detect model property conflicts while form is being edited (in "dirty" state)

## Disclaimer

This project is currently in **alpha** phase. Public API of the library is still under active development.

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
  }
});
```

##### Route with form route mixin (which instantiates todo form object)
```javascript
import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';

export default Ember.Route.extend(FormRouteMixin, {
  formName: 'todo',

  model(params) {
    return this.store.peekRecord('todo', params.id);
  },

  afterModel() {
    this._super(...arguments);
    this.set('form.people', this.store.peekAll('user'));
  },

  actions: {
    saveModelForm() {
      this.get('form').save();
      // .then() => form saved
      // .catch() => validation probably failed
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

## Development

### TODOs (by priority)
* Add "isValid" state to each property
* Move server validation error logic to base form object
* Example page & docs
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
