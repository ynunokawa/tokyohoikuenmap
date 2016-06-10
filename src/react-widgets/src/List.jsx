import React   from 'react';
import ListOption from './ListOption';
import CustomPropTypes from './util/propTypes';
import compat from './util/compat';
import cn from 'classnames';
import _  from './util/_';
import { dataText, dataValue } from './util/dataHelpers';
import { instanceId, notify } from './util/widgetHelpers';
import { isDisabledItem, isReadOnlyItem }  from './util/interaction';

let optionId = (id, idx)=> `${id}__option__${idx}`;

export default React.createClass({

  displayName: 'List',

  mixins: [
    require('./mixins/ListMovementMixin'),
    require('./mixins/AriaDescendantMixin')()
  ],

  propTypes: {
    data:          React.PropTypes.array,
    onSelect:      React.PropTypes.func,
    onMove:        React.PropTypes.func,

    optionComponent: CustomPropTypes.elementType,
    itemComponent:   CustomPropTypes.elementType,

    selected:      React.PropTypes.any,
    focused:       React.PropTypes.any,
    valueField:    CustomPropTypes.accessor,
    textField:     CustomPropTypes.accessor,

    disabled:      CustomPropTypes.disabled.acceptsArray,
    readOnly:      CustomPropTypes.readOnly.acceptsArray,

    messages:      React.PropTypes.shape({
      emptyList:   CustomPropTypes.message
    })
  },


  getDefaultProps(){
    return {
      onSelect: ()=>{},
      optionComponent: ListOption,
      ariaActiveDescendantKey: 'list',
      data: [],
      messages: {
        emptyList:   'There are no items in this list'
      }
    }
  },

  componentDidMount(){
    this.move()
  },

  componentDidUpdate(){
    let { data, focused } = this.props
      , idx = data.indexOf(focused)
      , activeId = optionId(instanceId(this), idx)

    this.ariaActiveDescendant(idx !== -1 ? activeId : null)

    this.move()
  },

  render(){
    var {
        className, role, data, textField, valueField
      , focused, selected, messages, onSelect
      , itemComponent: ItemComponent
      , optionComponent: Option
      , ...props  } = this.props
      , id = instanceId(this)
      , items;

    items = !data.length
      ? (
        <li className='rw-list-empty'>
          {_.result(messages.emptyList, this.props)}
        </li>
      ) : data.map((item, idx) => {
          var currentId = optionId(id, idx)
            , isDisabled = isDisabledItem(item, props)
            , isReadOnly = isReadOnlyItem(item, props);

          return (
            <Option
              key={'item_' + idx}
              id={currentId}
              dataItem={item}
              disabled={isDisabled}
              readOnly={isReadOnly}
              focused={focused === item}
              selected={selected === item}
              onClick={isDisabled || isReadOnly ? undefined : onSelect.bind(null, item)}
            >
              { ItemComponent
                ? <ItemComponent
                    item={item}
                    value={dataValue(item, valueField)}
                    text={dataText(item, textField)}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                  />
                : dataText(item, textField)
              }
            </Option>
          )
        });

    return (
      <ul
        id={id}
        tabIndex='-1'
        className={cn(className, 'rw-list')}
        role={role === undefined ? 'listbox' : role}
        { ...props }
      >
        { items }
      </ul>
    )
  },

  _data(){
    return this.props.data
  },

  move(){
    var list = compat.findDOMNode(this)
      , idx  = this._data().indexOf(this.props.focused)
      , selected = list.children[idx];

    if( !selected ) return

    notify(this.props.onMove, [ selected, list, this.props.focused ])
  }

})
