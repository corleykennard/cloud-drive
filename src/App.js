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

import { query as q } from "faunadb";

let api_url = "https://cloud-drive.vercel.app/api";
let counter = 0;
const fileSizeToShortString = (fileSize) => {
  if (fileSize < 2 ** 10) {
    return `${fileSize} B`;
  }
  if (fileSize < 2 ** 20) {
    return `${Math.floor(fileSize / 2 ** 10)} KB`;
  }
  if (fileSize < 2 ** 30) {
    return `${Math.floor(fileSize / 2 ** 20)} MB`;
  }
  return `${Math.floor(fileSize / 2 ** 30)} GB`;
};
const Error = () => <h1> It is Not Found</h1>;
const FileTableRow = (props) => {
  const { file, url } = props;
  if (file.data.type == "folder") {
    return (
      <tr>
        <th scope="row">1</th>
        <td>
          <Link to={`${url}/${file.data.name}`} key={file.data.name}>
            {file.data.name}
          </Link>
        </td>
        <td></td>
        <td>{file.ts}</td>
      </tr>
    );
  } else {
    return (
      <tr>
        <th scope="row">1</th>
        <td>
          <a
            href={`https://cloudflare-ipfs.com/ipfs/${file.data.ipfsHash}`}
            key={file.data.name}
          >
            {file.data.name}
          </a>
        </td>
        <td>{fileSizeToShortString(file.data.size)}</td>
        <td>{file.ts}</td>
      </tr>
    );
  }
};

const FileTable = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { url, path } = useRouteMatch();
  let { parent } = useParams();

  if (path == "/list/") {
    parent = "";
  }
  /*
  let params = new URLSearchParams(document.location.search.substring(1));
  let path = params.get("path");
*/
  useEffect(() => {
    setIsLoading(true);
    fetch(`${api_url}/database?func=getFilesInParent&arg=/${parent}`)
      .then((res) => res.json())
      .then((r) => {
        console.log(r);
        setData(r.data);
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
      });
    counter += 1;
    if (counter > 10) {
      alert(counter);
    }
  }, []);

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
          <FileTableRow url={url} file={file} />
        ))}
      </tbody>
    </table>
  );
};

const Navbar = (props) => {
  return (
    <nav className="navbar navbar-light bg-light justify-content-between">
      <a href="/" className="navbar-brand">
        Navbar
      </a>
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
