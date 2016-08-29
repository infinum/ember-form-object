# master
- [IMPROVEMENT/BREAKING] - Remove lodash dependency (which caused change in dirty comparison algorithm)
- [BREAKING] createForm is not exported in 'ember-form-object/utils/core' anymore but as a default export of 'ember-form-object/utils/create-form' module
- [BREAKING] Update ember-validations to 2.0.0-alpha.5 (check their changelog for public API changes)
- [IMPROVEMENT] It's now mandatory to call this._super() on init, beforeSubmit & afterSubmit methods
- [IMPROVEMENT] Add beforeModelSync and afterModelSync hooks

# 0.2.7
- [BUGFIX] - Fix assigning form to a controller
- [IMPROVEMENT] - Fix value normalization for dirty comparison (when comparing arrays)
- [FEATURE] - Add "isSaveError" state
- [BUGFIX] - Fix when should model properties sync with model
- [BREAKING] - Rename form state typo "isSubmiting" to "isSubmitting"

# 0.2.6
- [FEATURE] - Add support for readonly properties that can't be in dirty state
- [BREAKING] - Remove setAllPropertiesDirtyFlag public API
- [IMPROVEMENT] - Add resetting virtual properties & dirty state after submit
- [BUGFIX] - Detect server validation error properly
- [BUGIFX] - Disable model property sync on model rollback after server validation error
- [BREAKING] - Rename few public API methods (check out 683613547c0a commit message)

# 0.2.5
- [FIX] - Fix update initial value on setting calculated values to virtual properties

# 0.2.4
- [FEATURE] Detect conflicts with model properties (via modelPropertyConflictDidOccur)
- [IMPROVEMENT] Improve detection if form property should be updated after model property had changed
- [IMPROVEMENT] Expose server response in submit error handler (thx safo6m)

# 0.2.3
- [FIX] Correctly set model properties to model in _setModelPropertiesToModel

# 0.2.2
- [IMPROVEMENT] Form route mixin depends on model argument in afterModel hook
- [FIX/BREAKING] Fix handling server validation errors rollbacking attributes only on saved models

# 0.2.1
- [IMPROVEMENT] Run async callbacks safely (check if form object is destroying or destroyed)

# 0.2.0
- [IMPROVEMENT] Update dependencies
- [IMPROVEMENT] Add rejection message in save handler
- [IMPROVEMENT/BREAKING] Delete "isNew" model record in form object destroy handler
- [FEATURE] Add server side validation handling with is-valid-on-server validator
