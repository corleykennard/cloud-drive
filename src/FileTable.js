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

const tsToString = (ts) => {
  const diff = Date.now() - Math.floor(ts/1e3)
  if (diff < 1e3 * 60) {
    return `${Math.floor(diff / 1e3)}s ago`;
  }
  if (diff < 1e3 * 60 * 60) {
    return `${Math.floor((diff / 1e3) * 60)}m ago`;
  }
  if (diff < 1e3 * 60 * 60 * 24) {
    return `${Math.floor((diff / 1e3) * 60 * 60)}h ago`;
  }
  if (diff < 1e3 * 60 * 60 * 24 * 7) {
    return `${Math.floor((diff / 1e3) * 60 * 60 * 24)}d ago`;
  }

  if (diff < 1e3 * 60 * 60 * 24 * 30) {
    return `${Math.floor((diff / 1e3) * 60 * 60 * 24 * 7)}w ago`;
  }
  if (diff < 1e3 * 60 * 60 * 24 * 365) {
    return `${Math.floor((diff / 1e3) * 60 * 60 * 24 * 30)}mth ago`;
  } else {
    return `${Math.floor((diff / 1e3) * 60 * 60 * 24 * 365)}y ago`;
  }
};

const FileTableRow = (props) => {
  const { file, url } = props;
  if (file.data.type == "folder") {
    return (
      <tr>
        <td>
          <input className="uk-checkbox" type="checkbox" />
        </td>
        <td>
          <img
            className="uk-preserve-width"
            src="https://img.icons8.com/fluent/344/folder-invoices.png"
            width="40"
            alt=""
          />
        </td>
        <td className="uk-table-link">
          <Link
            className="uk-link-reset"
            to={`${url}/${file.data.name}`}
            key={file.data.name}
          >
            {file.data.name}
          </Link>
        </td>
        <td className="uk-text-nowrap"></td>
        <td className="uk-text-nowrap">{tsToString(file.ts)}</td>
      </tr>
    );
  } else {
    return (
      <tr>
        <td>
          <input className="uk-checkbox" type="checkbox" />
        </td>
        <td>
          <img
            className="uk-preserve-width"
            src="https://img.icons8.com/color/344/file.png"
            width="40"
            alt=""
          />
        </td>
        <td className="uk-table-link">
          <a
            className="uk-link-reset"
            href={`https://cloudflare-ipfs.com/ipfs/${file.data.ipfsHash}`}
            key={file.data.name}
          >
            {file.data.name}
          </a>
        </td>
        <td className="uk-text-nowrap">
          {fileSizeToShortString(file.data.size)}
        </td>
        <td className="uk-text-nowrap">{tsToString(file.ts)}</td>
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
  }, [parent]);

  return (
    <div className="uk-overflow-auto">
      <table className="uk-table uk-table-hover uk-table-middle uk-table-divider">
        <thead>
          <tr>
            <th className="uk-table-shrink">
              <input className="uk-checkbox" type="checkbox" />
            </th>
            <th className="uk-table-shrink">Images</th>
            <th className="uk-table-expand">Name</th>
            <th className="uk-table-shrink">Size</th>
            <th className="uk-table-shrink">Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((file) => (
            <FileTableRow url={url} file={file} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;