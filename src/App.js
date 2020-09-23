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
let counter = 0;
let api_url = "https://cloud-drive.vercel.app/api/";
const Error = () => <h1> It is Not Found</h1>;
const FileTable = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  let { url } = useRouteMatch();
  let params = new URLSearchParams(document.location.search.substring(1));
  let path = params.get("path");

  useEffect(() => {
    setIsLoading(true);
    fetch("https://cloud-drive.corleykennard.vercel.app/api/database/", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ func: "getFilesInParent", arg: path }),
    })
      .then((res) => {
        res.json();
        alert("fetch", (counter += 1));
      })
      .then((res) => {
        setData(res.data);
        setIsLoading(false);
      })
      .catch(function (res) {
        alert(`Path is ${path}`)
        console.log(res);
      });
  });

  return (
    <div className="list-group container-fluid w-100">
      <a href="" className="list-group-item row">
        <p className="col-6">name</p>
        <p className="col-2">size</p>
        <p className="col-2">time</p>
      </a>
      {data.map((file) => (
        <Link
          to={`${url}/${file.data.name}`}
          className="list-group-item list-group-item-action row"
          key={file.data.name}
        >
          <p className="col-6">{file.data.name}</p>
          <p className="col-2">{file.data.size}</p>
          <p className="col-2">{file.ts}</p>
        </Link>
      ))}
    </div>
  );
};

const Navbar = (props) => {
  return (
    <nav className="navbar navbar-light bg-light justify-content-between">
      <a className="navbar-brand">Navbar</a>
      <form className="form-inline">
        <input
          className="form-control mr-sm-2"
          type="search"
          placeholder="Search"
          aria-label="Search"
        ></input>
        <button className="btn btn-outline-success my-2 my-sm-0" type="submit">
          Search
        </button>
      </form>
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
                  return <Redirect to="/list?path=/" />;
                }}
              />
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
