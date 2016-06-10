import React, {Component} from 'react';
import Multiselect from 'react-widgets/lib/Multiselect';

var propTypes = {
    layers: React.PropTypes.array
};

export default class Layerlist extends Component {
    constructor() {
        super();
        this.state = {
            count: 0,
            visibleLayers: [],
            hideLayers: []
        }
    }

    handleClick() {
        this.setState({
            count: this.state.count + 1
        });
    }

    render() {
        return (
            <div layers={this.props.layers}>
                Count: {this.state.count}
                <button onClick={this.handleClick.bind(this)}>increment</button>
                <Multiselect defaultValue={[]} data={this.state.hideLayers}/>
            </div>
        );
    }
}