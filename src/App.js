import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';

import SlateComponent from "./components/slate";

class App extends Component {
  render() {
    return (
      <div className="App">
        <SlateComponent></SlateComponent>
      </div>
    );
  }
}

export default App;
