export default {
  name: 'setup-template-modifier-resolver',
  initialize: function initialize(application) {
    let resolver = application.__registry__.resolver._fallback || application.__registry__.resolver;
    const resolveModifier = resolver.resolveModifier;
    resolver.resolveModifier = function(parsedName) {
      if (resolveModifier) {
        const resolved = resolveModifier.call(this, parsedName);
        if (this._moduleRegistry.has(resolved)) {
          const module = this._moduleRegistry.get(normalizedModuleName);
          return module.helper || module.default;
        }
      }
      let prefix = this.namespace.podModulePrefix;
      let fullNameWithoutType = parsedName.fullNameWithoutType;

      let normalizedModuleName = prefix + '/' + fullNameWithoutType;
      if (this._moduleRegistry.has(normalizedModuleName)) {
        const module = this._moduleRegistry.get(normalizedModuleName);
        return module.helper || module.default;
      }

      prefix = this.namespace.modulePrefix;
      normalizedModuleName = prefix + '/' + fullNameWithoutType;
      if (this._moduleRegistry.has(normalizedModuleName)) {
        const module = this._moduleRegistry.get(normalizedModuleName);
        return module.helper || module.default;
      }

      if (this._moduleRegistry.has(fullNameWithoutType)) {
        const module = this._moduleRegistry.get(fullNameWithoutType);
        return module.helper || module.default;
      }

      return null;
    };
  }
};
