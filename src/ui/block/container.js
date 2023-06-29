import React from 'react';



function Container(props) {
    const containerStyle = {
        height: "97vh"
    }

    return <div className='container-fluid' style={containerStyle}>{props.children}</div>
}


export { Container }