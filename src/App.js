import React, { Component, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Link,
  NavLink,
  Switch,
  Redirect,
} from "react-router-dom";

import { useRouteMatch, useParams } from "react-router";
import FileTable from "./FileTable"
import { query as q } from "faunadb";

let api_url = "https://cloud-drive.vercel.app/api";
let counter = 0;

const Error = () => <h1> It is Not Found</h1>;

const Navbar = (props) => {
  return (
    <nav class="uk-navbar-container" uk-navbar>
    <div class="uk-navbar-left">
        <ul class="uk-navbar-nav">
            <li class="uk-active"><a href=""></a></li>
            <li class="uk-parent"><a href=""></a></li>
            <li><a href=""></a></li>
        </ul>
    </div>
</nav>
  );
};

class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <div>
            <Navbar />

            <Switch>
              <Route
                exact
                path="/"
                render={() => {
                  return <Redirect to="/list/" />;
                }}
              />
              <Route exact path="/list/" component={FileTable} />
              <Route path="/list/:parent*" component={FileTable} />
              <Route component={Error} />
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
