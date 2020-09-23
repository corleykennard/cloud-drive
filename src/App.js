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

import faunadb from "faunadb";
let q = faunadb.query;

let api_url = "https://cloud-drive.vercel.app/api/";

const Home = (props) => (
  <h1>
    {" "}
    My Home is in {props.location},{props.country}
  </h1>
);
const About = () => <h1>About</h1>;
const Contact = () => <h1>Contact</h1>;
const Error = () => <h1> It is Not Found</h1>;
const LogIn = () => <h1>Please login</h1>;

const FileTable = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
let {url } = useRouteMatch();
  let params = new URLSearchParams(document.location.search.substring(1));
  let path = params.get("path")

  useEffect(() => {
    setIsLoading(true)
    fetch("https://cloud-drive.corleykennard.vercel.app/api/database/", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ func: "getFilesInParent", arg: path}),
    })
      .then((res) => res.json())
      .then((res) => {setData(res.data); setIsLoading(false)})
      .catch(function (res) {
        console.log(res);
      });
  });

  return (
    <div className="list-group container-fluid w-100">
    <a href="#" className="list-group-item row">
      <input type="checkbox" className="col-2 form-control form-control-lg custom-control-input">
      <h6 className="col-6">name</h6>
            <small className="col-2">size</small>
            <small className="col-2">time</small>
</a>
      {data.map((file) => (
        <Link
          to={`${url}/${file.data.name}`}
          className="list-group-item list-group-item-action row"
          key={file.data.name}
        >
              <input type="checkbox" className="col-2 form-control form-control-lg custom-control-input">
            <h6 class="col-6">{file.data.name}</h6>
            <small className="col-2">{file.data.size}</small>
            <small className="col-2">{file.ts}</small>
        </Link>
      ))}
    </div>
  );
};

const User = (props) => {
  let username = props.username;
  return (
    <div>
      <h1>Welcome {username}</h1>;
    </div>
  );
};

const Navbar = (props) => {
  return (
    <ul>
      <li>
        <NavLink to="/">HOME</NavLink>
      </li>
      <li>
        <NavLink to="/about">ABOUT</NavLink>
      </li>
      <li>
        <NavLink to="/parent/Music">Music</NavLink>
      </li>
      <li>
        <NavLink to="/user/Asabeneh">User Asabeneh</NavLink>
      </li>
      <li>
        <NavLink to="/user/John">User John</NavLink>
      </li>
    </ul>
  );
};

class App extends Component {
  state = {
    loggedIn: false,
  };

  handleLogin = () => {
    this.setState((prevState) => ({
      loggedIn: !prevState.loggedIn,
    }));
  };

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
                  return <Redirect to="/parent/" />;
                }}
              />
              <Route exact strict path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/Music" component={LogIn} />
              <Route path="/list" component={FileTable} />
              <Route component={Error} />
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
