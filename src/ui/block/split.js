import React from 'react';


let valueEvent = {
  splitBottom: false,
  splitColumns: false,
  splitColumnsTarget: 1,
  moveElement: false,
  mouse: {
      x: 0,
      y: 0
  },
  elementBar: {
      isDrag: false,
      isResize: false,
      resizeLocation: 'left',
      resizeRangeLeft: 0,
      resizeRangeRight: 0,
      e: undefined,
      blob: '',
      criteria: {x: 0, y: 0, duration: 1000},
      criteriaResize: {x: 0, y: 0}
  },
  element: {
      isDrag: false,
      e: undefined,
      initial: {x: 0, y: 0}
  }
}


const page = {
  split: {
      bottom: function (percent) {

          //document.getElementById(`option_bottom`).style.height = `calc(${100-percent}% - 3.5rem)` // 옵션 오프캔버스                    

      },
      columns: function (percent) {
          if (valueEvent.splitColumnsTarget == 1) {
              let otherCol = Number(document.getElementById(`split_col_3`).style.width.split('%')[0])
              document.getElementById(`split_col_1`).style.width = `${percent}%`
              document.getElementById(`split_col_2`).style.width = `${(100-percent) - otherCol}%`       
          } else if (valueEvent.splitColumnsTarget == 2) {
              let otherCol = Number(document.getElementById(`split_col_1`).style.width.split('%')[0])
              document.getElementById(`split_col_2`).style.width = `${percent - otherCol}%`
              document.getElementById(`split_col_3`).style.width = `${(100 - percent)}%`    
          }
      },
  },
  minWidth: 20,
  minHeight: 20
}





function startSplitColumns(colNumber) {
  valueEvent.splitColumns = true
  valueEvent.splitColumnsTarget = colNumber
}

function SplitTop(props) {
  const [height, setHeight] = React.useState('80%')



  return <div className='row align-items-start' style={ { height: height } }>
    {props.children}
  </div>
}


function SplitBottom(props) {
  const [splitBottom, setSplitBottom] = React.useState(false)
  const [height, setHeight] = React.useState('20%')

  let mouse = {
    x: 0, 
    y: 0
  }


  const handleStartSplitBottom = () => {
    setSplitBottom(true)
  }

  document.addEventListener("mousemove", (e) => {
    mouse.x = e.pageX
    mouse.y = e.pageY
  
    if (splitBottom) {
        let percent = e.pageY/document.body.offsetHeight*100  <= page.minHeight ? page.minHeight : e.pageY/document.body.offsetHeight*100
        SplitTop.setHeight(`calc(${percent}% + 0.5rem)`)
        setHeight(`calc(${100-percent}% - 0.5rem)`)

        document.querySelector("element-control").resizeEvent()
    }
  
  })
  
  
  document.addEventListener("mouseup", (e) => {
    setSplitBottom(false)
  })

  return <div className='row position-relative split-top align-items-end bg-darker line-top' style={ { height : height } }>
    <SplitBottomMover handleStartSplitBottom={handleStartSplitBottom}></SplitBottomMover>
    {props.children}
  </div>
}

function SplitColumns(props) {

  const handleOnMouseDown = () => {
    //setSplitBottom(true)
  }

  return <div className='split-col-bar' onMouseDown={handleOnMouseDown}>
  </div>
}



function SplitBottomMover(props) {
  return <div className='split-bottom-bar cursor-row-resize' onMouseDown={props.handleStartSplitBottom}></div>
}


export { SplitTop, SplitBottom, SplitColumns }