import React, { Component } from 'react';
import { Editor } from 'slate-react'
import { Block, Value } from 'slate';


import Icon from "react-icons-kit";
import {image, camera, listNumbered, list } from 'react-icons-kit/icomoon'

import initialValue from "../value.json";

import Toolbar from "./toolbar";

const DEFAULT_NODE = 'paragraph';

const tabObj = {
  'true': [  'disc-list', 'circle-list', 'square-list' ],
  'false': [ 'decimal-list', 'lower-latin-list', 'lower-roman-list' ]
};

const plugins = [ 
  {
    onKeyDown: (event, editor, next) => {
      let block = parseInt( document.getElementById('maxBlock').value , 10);

      block = Number.isNaN( block ) ? 0 : block;
      
			try {
	      let nodes = editor['value']['document']['nodes']['_tail']['array'].reduce( (total, current) => {
	        if( current['text'].trim() !== "" ) {
	          total ++;
	        }
	        return total;
	      }, 0 );
   
	      if( block !== 0 &&  nodes > block ) {
	        event.preventDefault();
	        next();
	      } else {
	        next();
	      }	
			}
			catch(e) {
				next();
			}

    }
  }
 ];

function insertImage(change, src, target) {
  if (target) {
    change.select(target)
  }

  change.insertBlock({
    type: 'image',
    data: { src },
  })
}


const schema = {
  document: {
    last: { type: 'paragraph' },
    normalize: (change, { code, node, child }) => {
      switch (code) {
        case 'last_child_type_invalid': {
          const paragraph = Block.create('paragraph')
          return change.insertNodeByKey(node.key, node.nodes.size, paragraph)
        }
        default:
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
    },
  },
}

const existingValue = JSON.parse(localStorage.getItem('content'))

let val = existingValue && typeof existingValue['document'] !== 'undefined' ? { document: existingValue['document'] } : initialValue;

class SlateComponent extends Component {

  state = {
    value:  Value.fromJSON(  val  ),
    tabValue: "bulleted-list",
    tabNumber: 0,
    selectUL: true
  }

  ref = editor => {
    this.editor = editor
  }

  onChange = ( { value } ) => {
   if (value.document !== this.state.value.document) {
    const content = JSON.stringify(value.toJSON())
    localStorage.setItem('content', content)
   }

    this.setState({ value })
  }


  onClickImage = event => {
    event.preventDefault()
    const src = window.prompt('Enter the URL of the image:')

    if (!src) return

    this.editor.change(insertImage, src)
  }

  saveData = () => {
    const existingValue = JSON.parse(localStorage.getItem('content'))
    const content = JSON.stringify(existingValue)
    localStorage.setItem('saveContent', content)
  }

  cancelData = () => {
    const existingValue = JSON.parse(localStorage.getItem('saveContent'))
    const content = JSON.stringify(existingValue)
    localStorage.setItem('content', content )
    window.location.reload(); 
  }

  render() {
    return (
      <div>
        <input type="file" id="imageUploadId" accept='image/*' style={{display: "none"}} onChange={this.readURL} />

        <Toolbar>
          <span className="tooltip-icon-button separator" onMouseDown={this.onClickImage}>
            <Icon icon={image} />
          </span>

          <span className="tooltip-icon-button separator" onClick={this.imageUpload}>
          <Icon icon={camera} />
          </span>

          {this.renderBlockButton('numbered-list', listNumbered)}
          {this.renderBlockButton('bulleted-list', list)}
         
          <button className="separator"  onClick={this.saveData}>
            Save
          </button>

          <button className="separator"   onClick={this.cancelData}>
            Cancel
          </button>

          <input type="number" id="maxBlock" placeholder="max block"  /> 

        </Toolbar>

        <Editor 
          placeholder="Enter some text..."
          ref={this.ref}
          value={this.state.value} 
          plugins={plugins}
          schema={schema}
          onChange={this.onChange}  
          onKeyDown={this.onKeyDown}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          />
      </div>
    )
  }
                                          
  imageUpload(props, next) {
    window.document.getElementById(`imageUploadId`).click()
  }

  readURL= (event, change, nex) => {
    
    const [mime] = event.target.files[0].type.split('/')

    if (mime !== 'image') {
      alert("must be image");
    } else {
      var reader = new FileReader();
      reader.addEventListener('load', () => {
        this.editor.change(c => {
          c.call(insertImage, reader.result, event.target)
        })
      })
  
      reader.readAsDataURL( event.target.files[0] );
    }
  }

  renderNode = (props, next) => {

    const { node, attributes, children, isFocused } = props;

    switch ( node.type) {

      case 'bulleted-list': {
        return <ul {...attributes}>{children}</ul>
      }

      case 'list-item': {
        return <li {...attributes}>{children}</li>
      }

      case 'circle-list': {
        return <ul className="circle" {...attributes}>{children}</ul>
      }
      case 'disc-list': {
        return <ul className="disc" {...attributes}>{children}</ul>
      }
      case 'square-list': {
        return <ul className="square" {...attributes}>{children}</ul>
      }

      case 'numbered-list': {
        return <ol {...attributes}>{children}</ol>
      }

      case 'decimal-list': {
        return <ol className="decimal" {...attributes}>{children}</ol>
      }
      case 'lower-latin-list': {
        return <ol className="lower-latin" {...attributes}>{children}</ol>
      }
      case 'lower-roman-list': {
        return <ol className="lower-roman"  {...attributes}>{children}</ol>
      }

      case 'image': {
        const src = node.data.get('src')
        return <img src={src} alt="" selected={isFocused} {...attributes} />
      }
      default:
        return next()
    }
  }

  renderMark = (props, next) => {
    switch(props.mark.type) {
      default:
        return next()
    }
  }

  hasBlock = type => {
    const { value } = this.state
    return value.blocks.some(node => node.type === type)
  }


  renderBlockButton = (type, icon) => {
     return (
      <span className="separator"
        onMouseDown={event => this.onClickBlock(event, type)}
      >
        <Icon icon={icon} />
      </span>
    )
  }

  // Define a new handler which prints the key that was pressed.
  onKeyDown = (event, change, next) => {
    // const { value } = change
   
   if( event.shiftKey && event.key === 'Tab' ) {
      const { value } = this.state;
      let selectUL = this.state.selectUL;
      let tabNumber = this.state.tabNumber - 1;

      event.preventDefault();
      
      value.blocks.forEach(function( block) {
        // console.log(block.key, "  <?  ===>  ", value.document.getParent(block.key).key );
        // console.log("value.document.getParent(block.key).key : ", value.document.getParent(block.key).key);
        // total =  value.document.getParent(block.key).key
        // return total;
        // console.log(block.key, " <> value.document.getParent(block.key) : ", value.document.getParent(block.key));
				try {
					change.unwrapNodeByKey( value.document.getParent(block.key).key)
				}
				catch(e) {}
        
        // value.document.unwrapNodeByKey( value.document.getParent(block.key).key )
      });

      this.setState({
        selectUL,
        tabNumber
      });
      // console.log(" parentKey :  ", parentKey);
      
    } 
    else if( event.key === 'Tab' ) {
			console.log("~~~~~~~~~~~~~~  press tab  ~~~~~~~~~~~~~~~~~~~");
      let tabNumberX =  this.state.tabNumber;
			let selectUL =  this.state.selectUL;
			console.log("Tab  tabNumberX 1 :: ", tabNumberX);
      
      tabNumberX =  tabNumberX + 1 ;
			if(  tabNumberX < 3 ) {
        this.setState({ tabNumber: tabNumberX })

        const isList = this.hasBlock('list-item');
        if( isList ) {
					console.log( " tabNumberX 2: ", tabNumberX , "  <<>> selectUL :: ", selectUL );
          change
            .setBlocks('list-item')
            .wrapBlock( tabObj[ selectUL.toString()  ][ tabNumberX ]  )
        }
      }
      console.log("~~~~~~~~~~~~~  end of press tab  ~~~~~~~~~~~~~~~~~~~~~");
    } 

    return next();
  }

  onClickBlock = (event, type) => {
    event.preventDefault();
   
    this.editor.change(change => {
      const { value } = change
      const { document } = value;
      // Handle everything but list buttons.
      if (type !== 'bulleted-list' && type !== 'numbered-list') {
        const isActive = this.hasBlock(type)
        const isList = this.hasBlock('list-item')

        if (isList) {
          change
            .setBlocks(isActive ? DEFAULT_NODE : type)
            .unwrapBlock('bulleted-list')
            .unwrapBlock('numbered-list')
        } else {
          change.setBlocks(isActive ? DEFAULT_NODE : type)
        }
      } else {
				console.log("`````````````````````  start on click   `````````````````````````````");
        let selectUL = this.state.selectUL;
        let tabNumber = this.state.tabNumber;
				console.log("selectUL 1 : [ ", selectUL, " ]  ## tabNumber 1 :  ", tabNumber);

        // Handle the extra wrapping required for list buttons.
        const isList = this.hasBlock('list-item');
        const isType = value.blocks.some(block => {
          return !!document.getClosest(block.key, parent => parent.type === type)
        });
				console.log("isList : ", isList , "  isType : ", isType);
 
        if (isList && isType) {
					console.log("?????????????????????????????????????");
					console.log( " isList && isType :===> ", ( isList && isType ) );
          change
            .setBlocks(DEFAULT_NODE)
            .unwrapBlock('bulleted-list')
            .unwrapBlock('numbered-list')
						.unwrapBlock( tabObj[ selectUL.toString()] [tabNumber]  )
        } else if (isList) {
					console.log("...........................................");
					console.log( " isList 2222 :: ", isList, " @@@  selectUL 1 : ", selectUL, "  @@@@ tabNumber 1 :  ", tabNumber );
          selectUL =  !selectUL;
          // tabNumber = tabNumber < 3 ? 1 : tabNumber;
          change
            .unwrapBlock(
              type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
            )
            .wrapBlock( tabObj[ selectUL.toString()] [tabNumber] )
        } else {
					console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,");
					console.log("new block ::  type : ", type);
          
          selectUL =  type === 'numbered-list' ? false : true;
          // tabNumber = tabNumber < 3 ? 0 : tabNumber  ;
					// console.log(  )
					change.setBlocks('list-item').wrapBlock( tabObj[ selectUL.toString()] [ tabNumber] )
        }
				
				console.log("selectUL x : [ ", selectUL, " ]  ## tabNumber x :  ", tabNumber);
        this.setState({
          selectUL,
          tabNumber
        });
				
				console.log("<<<<<<<<<<<<<<<<<<  end of onclick >>>>>>>>>>>>>>>>>>>>>>>>");
				console.log("");
      }
    })
  }

}

export default SlateComponent