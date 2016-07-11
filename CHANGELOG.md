# 0.2.6
- [FEATURE] - Add support for readonly properties that can't be in dirty state

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
