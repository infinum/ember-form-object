# 0.2.10
- [FEATURE] Add form-loss-preventer service and use it on route mixin to enable multiple form loss preventions on one route
- [FIX/BREAKING] Remove resetController handler in route mixin
- [FEATURE] Add support for multiple forms on form route mixin

# 0.2.9
- [FIX] Setting calculated values only to writeable (!readonly) virtual properties
- [FIX] Fixed dirty detection of date properties
- [FEATURE] Set saveError object to form so it can be used to display error messages
- [FEATURE] Add allowSaveIfNotDirty config
- [BREAKING] Remove deleting isNew models in model form destroy hook

# 0.2.8
- [FIX/BREAKING] - Remove lodash dependency (which caused change in dirty comparison algorithm)
- [BREAKING] createForm is not exported in 'ember-form-object/utils/core' anymore but as a default export of 'ember-form-object/utils/create-form' module
- [BREAKING] Update ember-validations to 2.0.0-alpha.5 (check their changelog for public API changes)
- [FIX/BREAKING] It's now mandatory to call this._super() on init, beforeSubmit & afterSubmit methods
- [FEATURE] Add beforeModelSync and afterModelSync hooks
- [FEATURE] Add support for "ordered" option in property definition (#5)
- [FIX] Fix setting virtual async property through class setter method
- [FEATURE] Add form.reset() API
- [BREAKING] Rename form.rollbackAttributes() to form.rollbackModelAttributes() for consistency

# 0.2.7
- [FIX] - Fix assigning form to a controller
- [FIX] - Fix value normalization for dirty comparison (when comparing arrays)
- [FEATURE] - Add "isSaveError" state
- [FIX] - Fix when should model properties sync with model
- [BREAKING] - Rename form state typo "isSubmiting" to "isSubmitting"

# 0.2.6
- [FEATURE] - Add support for readonly properties that can't be in dirty state
- [BREAKING] - Remove setAllPropertiesDirtyFlag public API
- [FIX] - Add resetting virtual properties & dirty state after submit
- [FIX] - Detect server validation error properly
- [FIX] - Disable model property sync on model rollback after server validation error
- [BREAKING] - Rename few public API methods (check out 683613547c0a commit message)

# 0.2.5
- [FIX] - Fix update initial value on setting calculated values to virtual properties

# 0.2.4
- [FEATURE] Detect conflicts with model properties (via modelPropertyConflictDidOccur)
- [FIX] Improve detection if form property should be updated after model property had changed
- [FIX] Expose server response in submit error handler (thx safo6m)

# 0.2.3
- [FIX] Correctly set model properties to model in _setModelPropertiesToModel

# 0.2.2
- [FIX] Form route mixin depends on model argument in afterModel hook
- [FIX/BREAKING] Fix handling server validation errors rollbacking attributes only on saved models

# 0.2.1
- [FIX] Run async callbacks safely (check if form object is destroying or destroyed)

# 0.2.0
- [FIX] Update dependencies
- [FIX] Add rejection message in save handler
- [FIX/BREAKING] Delete "isNew" model record in form object destroy handler
- [FEATURE] Add server side validation handling with is-valid-on-server validator
