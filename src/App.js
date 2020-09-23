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
function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

const Error = () => <h1> It is Not Found</h1>;
const FileTable = () => {
  const [data, setData] = useState([]);
//  const [isLoading, setIsLoading] = useState(false);
  let { url } = useRouteMatch();
  let params = new URLSearchParams(document.location.search.substring(1));
  let path = params.get("path");

  useEffect(() => {
    let res = JSON.parse(httpGet(
      `https://cloud-drive.corleykennard.vercel.app/api/database?func=getFilesInParent&arg=/${path}`
    ))
        setData(res.data)
  });

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">name</th>
          <th scope="col">size</th>
          <th scope="col">time</th>
        </tr>
      </thead>
      <tbody>
        {data.map((file) => (
          <tr>
            <th scope="row">1</th>
            <td>
              {" "}
              <Link
                to={`${url}/${file.data.name}`}
                className="list-group-item list-group-item-action row"
                key={file.data.name}
              >
                {file.data.name}
              </Link>
            </td>
            <td>{file.data.name}</td>
            <td>{file.data.size}</td>
            <td>{file.ts}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
