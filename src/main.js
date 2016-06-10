import React from 'react';
import ReactDom from 'react-dom';
import Layerlist from './Layerlist';

window.WebMapTemplate = {
    render:  () => {
        ReactDom.render(
            <Layerlist />,
            document.getElementById('webmapTemplate')
        );
    }
};