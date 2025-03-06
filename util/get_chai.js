let chai_obj = null;

const get_chai = async () => {
  if (!chai_obj) {
    const { expect, use } = require('chai');
    const chaiHttp = require('chai-http');
    use(chaiHttp);
    chai_obj = { expect, request: require('chai').request };
  }
  return chai_obj;
};

module.exports = get_chai;
