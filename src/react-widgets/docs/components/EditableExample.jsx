var React = require('react')
  , ReactDOM = require('react-dom')
  , Playground = require('@monastic.panic/component-playground/Playground')
  , ReactWidgets = require('../../src/index')
  , MultiselectTagList = require('react-widgets/MultiselectTagList')
  , List = require('react-widgets/List')
  , genData = require('./generate-data');


var scope = {
  ReactWidgets: { ...ReactWidgets, MultiselectTagList, List },
  listOfPeople(){
    return genData(15)
  },
  React,
  ReactDOM
}

module.exports = React.createClass({
  render() {
    return (
      <Playground
        {...this.props}
        mode='jsx'
        theme='oceanicnext'
        scope={scope}
      />
    );
  }
});
