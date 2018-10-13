import React, { Component } from 'react';
import { Editor } from 'slate-react'
import { Block, Value } from 'slate'
import { isKeyHotkey } from 'is-hotkey'
import Plain from 'slate-plain-serializer'


import Icon from "react-icons-kit";
import {image, camera, listNumbered, list, list2} from 'react-icons-kit/icomoon'

import initialValue from "../value.json";

import Toolbar from "./toolbar";

const DEFAULT_NODE = 'paragraph'

/*
const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: '',
              },
            ],
          },
        ],
      },
      {
        object: "block",
        type: "image",
        data: {
          src: ""
        }
      },
    ],
  },
})
*/

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

// .unwrapBlock('bulleted-list')
// .unwrapBlock('numbered-list')

class SlateComponent extends Component {

  state = {
    value:  Value.fromJSON(  val  ),
    tabValue: "bulleted-list"
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

        </Toolbar>

        <Editor 
          placeholder="Enter some text..."
          ref={this.ref}
          value={this.state.value} 
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
      case 'list-item':
       return <li {...attributes}>{children}</li>
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>
      case 'image': {
        const src = node.data.get('src')
        return <img src={src} selected={isFocused} {...attributes} />
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

    // // let isActive = this.hasBlock(type)

    // if (['numbered-list', 'bulleted-list'].includes(type)) {
    //   const { value } = this.state
    //   const parent = value.document.getParent(value.blocks.first().key)
    //   // isActive = this.hasBlock('list-item') && parent && parent.type === type
    // }

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
    let type = "";
    if( event.key === 'Tab' ) {
      type = this.state.tabValue === "bulleted-list" ? "numbered-list" : "bulleted-list";
      this.setState( { tabValue: type } )
      change.setBlocks('list-item').wrapBlock(type)
    }

    if( event.shiftKey && event.key === 'Tab' ) {
      let type = this.state.tabValue === 'bulleted-list' ? 'numbered-list' : 'bulleted-list';
       change
        .unwrapBlock(
          this.state.tabValue === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
        )
        .wrapBlock(type)
        this.setState( { tabValue:type } )
    }

    return next();
  }

  onClickBlock = (event, type) => {
    event.preventDefault()
   
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
        // Handle the extra wrapping required for list buttons.
        const isList = this.hasBlock('list-item')
        const isType = value.blocks.some(block => {
          return !!document.getClosest(block.key, parent => parent.type === type)
        })

        if (isList && isType) {
          change
            .setBlocks(DEFAULT_NODE)
            .unwrapBlock('bulleted-list')
            .unwrapBlock('numbered-list')
        } else if (isList) {
          change
            .unwrapBlock(
              type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
            )
            .wrapBlock(type)
        } else {
          change.setBlocks('list-item').wrapBlock(type)
        }
      }
    })
  }

}

export default SlateComponent