
var module_validation = !/[^a-zA-Z0-9_]/;

function NetworkModule(module_name, network_obj) {
  if(!network_obj) {
    throw new Error('network_obj is required by NetworkModule.');
  }
  if(!module_validation.test(module_name)) {
    throw new Error('module_name is invalid and must contain number,letters,underscore only! (spaces not allowed)');
  }

  this.module_name = module_name;
  this.network_obj = network_obj;

  return this;
};
