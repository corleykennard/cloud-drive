import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Route,
  Link,
  NavLink,
  Switch,
  Redirect,
  Prompt,
} from "react-router-dom";
import {useRouteMatch,
useParams} from "react-router";

import faunadb from "faunadb";
let q = faunadb.query;

const data = [
  {
    ref: q.Ref(q.Collection("files"), "277184386427781632"),
    ts: 1600602480406000,
    data: {
      name: "LiliumfullVersion.mp3",
      type: "file",
      parent: "/Music",
      size: 4823447,
      hashes: { md5: "89513a31f94fb80f6b4cfb3503a40f94" },
      path: "/Music/LiliumfullVersion.mp3",
      ipfsHash: "QmZQTfhcdGjPyHE75MMzsbiVxpJqN8Ld7rZN8eQP9FYYjk",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184844658639360"),
    ts: 1600602917330700,
    data: {
      name: "Johann Pachelbel - Canon In D (Piano and Violin Duet).mp3",
      type: "file",
      parent: "/Music",
      size: 3793518,
      hashes: { md5: "0b170707474ec7a4f601eda4c9cdcece" },
      path: "/Music/Johann Pachelbel - Canon In D (Piano and Violin Duet).mp3",
      ipfsHash: "QmU2sWEhJodJtJS4QdV1XqfdCv7EM6nNq8s6QnUbgQ7MnW",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184844711068160"),
    ts: 1600602917399000,
    data: {
      name: "Kuchizuke BUCK - TICK.mp3",
      type: "file",
      parent: "/Music",
      size: 4858440,
      hashes: { md5: "94a095f3621aa994406265a93ae1dabb" },
      path: "/Music/Kuchizuke BUCK - TICK.mp3",
      ipfsHash: "QmVXELowTt26ixjgnyqT8Nx5EcGB1UXuc2P94mwkaWkZEV",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184845718749696"),
    ts: 1600602918360000,
    data: {
      name: "ChiiStarVideos - Shiki OP 2 full with Lyrics.mp3",
      type: "file",
      parent: "/Music",
      size: 5027458,
      hashes: { md5: "ade33d5eb665b96f957540721e73b4cb" },
      path: "/Music/ChiiStarVideos - Shiki OP 2 full with Lyrics.mp3",
      ipfsHash: "QmegxEzw6XQSn9GwRknx9rYCytzXbciiP9m1RoTKXycKfq",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184846102528512"),
    ts: 1600602918730000,
    data: {
      name: "Lilium - Elfen Lied [Piano Tutorial] (Synthesia) TheIshter.mp3",
      type: "file",
      parent: "/Music",
      size: 5344615,
      hashes: { md5: "014c7089e08ff05bb03a3307a680a84b" },
      path:
        "/Music/Lilium - Elfen Lied [Piano Tutorial] (Synthesia) TheIshter.mp3",
      ipfsHash: "QmaayCVFoTc4QNnXKtmKs9QmdASmupxFgGrJDMCphvd2Se",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184846370963987"),
    ts: 1600602919050000,
    data: {
      name: "Kiseijuu-Next To You ᴴᴰ [Full Version].mp3",
      type: "file",
      parent: "/Music",
      size: 6614679,
      hashes: { md5: "15b7d481789fe592be3230c6e474ba6b" },
      path: "/Music/Kiseijuu-Next To You ᴴᴰ [Full Version].mp3",
      ipfsHash: "QmXfqXKqcBpxn3woPDrV3UsFvJeDW8zaJe7hJ9cvS16X1M",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847160541715"),
    ts: 1600602919688100,
    data: {
      name:
        "Natsume's Book of Friends ED - Summer Evening Sky (cello) _ Peaceful.mp3",
      type: "file",
      parent: "/Music",
      size: 7068244,
      hashes: { md5: "64796e80c52e7609d226634a85642d6c" },
      path:
        "/Music/Natsume's Book of Friends ED - Summer Evening Sky (cello) _ Peaceful.mp3",
      ipfsHash: "QmQvmVueuTJ9tQRFFWrRfCW2Wa8KiJTmC3PKxYxsu5Cgct",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847259107859"),
    ts: 1600602919795000,
    data: {
      name: "Rise Against - Paper Wings.mp3",
      type: "file",
      parent: "/Music",
      size: 6244295,
      hashes: { md5: "dc812dd6ff85db152db60b23874d4166" },
      path: "/Music/Rise Against - Paper Wings.mp3",
      ipfsHash: "QmSHSjkmP4XtZiQd4x9Fmbkv6G3PbMQyApBQdy89e4yj2v",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847374451219"),
    ts: 1600602919899400,
    data: {
      name:
        "Natsume's Book of Friends ED - Summer Evening Sky (cello) | Peaceful.mp3",
      type: "file",
      parent: "/Music",
      size: 7068244,
      hashes: { md5: "64796e80c52e7609d226634a85642d6c" },
      path:
        "/Music/Natsume's Book of Friends ED - Summer Evening Sky (cello) | Peaceful.mp3",
      ipfsHash: "QmQvmVueuTJ9tQRFFWrRfCW2Wa8KiJTmC3PKxYxsu5Cgct",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847540126227"),
    ts: 1600602920054000,
    data: {
      name: "Opening Shigatsu wa Kimi no Uso 1 Full Lyrics HD.mp3",
      type: "file",
      parent: "/Music",
      size: 6586451,
      hashes: { md5: "09ef91b58224b80d264dd7ead1ae40ba" },
      path: "/Music/Opening Shigatsu wa Kimi no Uso 1 Full Lyrics HD.mp3",
      ipfsHash: "QmWtsxdWnrhS2fC3FUhvUZXKp1SPVR79tgkkfZZqv9ftYq",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847682732563"),
    ts: 1600602920192300,
    data: {
      name:
        "_Sore wa Chiisana Hikari no Youna_ Erased Ending【Orchestral Cover】[Mike Reed IX].mp3",
      type: "file",
      parent: "/Music",
      size: 8144588,
      hashes: { md5: "08f9671d71180eb7f454d071289e7906" },
      path:
        "/Music/_Sore wa Chiisana Hikari no Youna_ Erased Ending【Orchestral Cover】[Mike Reed IX].mp3",
      ipfsHash: "QmfLLAhGZezamwmfqkvRxZrZm8Xq3Zdi5gA5AGfhSq2Xvg",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847725724160"),
    ts: 1600602920276000,
    data: {
      name: "Shiki-full Opening-with lyrics (Romaji + English).mp3",
      type: "file",
      parent: "/Music",
      size: 6630641,
      hashes: { md5: "23cf8ad144486043b9bd3348280c5c6e" },
      path: "/Music/Shiki-full Opening-with lyrics (Romaji + English).mp3",
      ipfsHash: "QmQUf2mtAhMigaFN9M11nGfPgreqtwLuxdvAEHZrB9aue1",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184847823241728"),
    ts: 1600602920736000,
    data: {
      name: "Seirei no Moribito - Opening (Shine Full Version).mp3",
      type: "file",
      parent: "/Music",
      size: 6679664,
      hashes: { md5: "823690318e2bbcba36979c1d3dcc3642" },
      path: "/Music/Seirei no Moribito - Opening (Shine Full Version).mp3",
      ipfsHash: "QmR1z5aYkZPAMCYQovafjQ8LtfmqZ1AGi8EqQ6TitK6w7i",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184848051831296"),
    ts: 1600602920588400,
    data: {
      name: "Devil Survivor 2 Full Opening Take Your way.mp3",
      type: "file",
      parent: "/Music",
      size: 7771454,
      hashes: { md5: "56d5a2adc1abd7910cd38a27c93f3d05" },
      path: "/Music/Devil Survivor 2 Full Opening Take Your way.mp3",
      ipfsHash: "QmZwR6k4ox3A1q6epQnbiceEo86jnToZYrRj6KbfMuSisi",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184848310829586"),
    ts: 1600602920969000,
    data: {
      name: "7!! - Orange [Shigatsu wa Kimi no Uso ED 2] Lyrics.mp3",
      type: "file",
      parent: "/Music",
      size: 9800993,
      hashes: { md5: "e48a8e12f3c22d52dba0af143ea973be" },
      path: "/Music/7!! - Orange [Shigatsu wa Kimi no Uso ED 2] Lyrics.mp3",
      ipfsHash: "QmYSi5K3sMSunm3mdiGikhMukVZbdnsATQ871LmPqoj5AP",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184848980869650"),
    ts: 1600602921478000,
    data: {
      name:
        "Evangelion - Cruel Angel's Thesis (FULL Opening) _ ENGLISH ver _ AmaLee.mp3",
      type: "file",
      parent: "/Music",
      size: 6169214,
      hashes: { md5: "daee19d526af084fda5bd79854bc7b1e" },
      path:
        "/Music/Evangelion - Cruel Angel's Thesis (FULL Opening) _ ENGLISH ver _ AmaLee.mp3",
      ipfsHash: "QmTjJcfFFGjnhAW3x3MfHotLMz4Q4zbSBxm9geWXXMsQsi",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184849293345298"),
    ts: 1600602921753000,
    data: {
      name: "Owari no Seraph Opening - X.U.mp3",
      type: "file",
      parent: "/Music",
      size: 6866997,
      hashes: { md5: "12912dc8975c838a1175327d6b2da11e" },
      path: "/Music/Owari no Seraph Opening - X.U.mp3",
      ipfsHash: "Qmd8UftYemqBbrJMSuo1wjzfzNgEGYtLrgLwqSxr8Dymf2",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184849708581395"),
    ts: 1600602922130000,
    data: {
      name: "focus.mp3",
      type: "file",
      parent: "/Music",
      size: 41278863,
      hashes: { md5: "de0fb4f0e3cabe7d0fa80926a97f17cf" },
      path: "/Music/focus.mp3",
      ipfsHash: "QmfS93iUt5XyZD2mCZaqMjbmb1ohKuyq6Z3VsfmqcypfKR",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184849767301651"),
    ts: 1600602922195000,
    data: {
      name:
        "SilverNightx1 - Devil Survivor 2 Full Opening Take Your way (ee6791cb).mp3",
      type: "file",
      parent: "/Music",
      size: 8170678,
      hashes: { md5: "3cdd30a748e414806d863d586adbed63" },
      path:
        "/Music/SilverNightx1 - Devil Survivor 2 Full Opening Take Your way (ee6791cb).mp3",
      ipfsHash: "QmWVW1DYBN3FsYaArQ1YGvbFyA1noS9LN4KmNBNWnkEhye",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184850157371923"),
    ts: 1600602922540000,
    data: {
      name: "01 - Zankoku na Tenshi no These [Director's Edit ].flac",
      type: "file",
      parent: "/Music",
      size: 30725882,
      hashes: { md5: "f2ba124ca6b44e0ac819bb74c6a83e01" },
      path: "/Music/01 - Zankoku na Tenshi no These [Director's Edit ].flac",
      ipfsHash: "QmXM1N8WMuE1GKVw4yMYNQfGL45z15bCJ3NvNEmUTHXqfV",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184850157372947"),
    ts: 1600602922613000,
    data: {
      name: "夏目友人帳ED　夏夕空.mp3",
      type: "file",
      parent: "/Music",
      size: 7019970,
      hashes: { md5: "4fe4c2f3cb357b2c5d2ada87febedd43" },
      path: "/Music/夏目友人帳ED　夏夕空.mp3",
      ipfsHash: "QmYw1w9fwpYmtX7qvbxMBmCK1g81jRyvDozRC8SBs8QAgy",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184850520179218"),
    ts: 1600602922947000,
    data: {
      name: "Seirei no moribito - Naji no Uta, Japanese and English lyrics.mp3",
      type: "file",
      parent: "/Music",
      size: 6901265,
      hashes: { md5: "5799878ba844fac7e5ec2718a8e89181" },
      path:
        "/Music/Seirei no moribito - Naji no Uta, Japanese and English lyrics.mp3",
      ipfsHash: "Qma5XmW5aLBpbCakBijKjtUKY5ED3HL6sv5MqFUWrXRhzn",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184851753304594"),
    ts: 1600602924148000,
    data: {
      name: "Itoshii Hito e (愛しい人へ; To the loved one) - Sachi Tainaka.mp3",
      type: "file",
      parent: "/Music",
      size: 9073632,
      hashes: { md5: "b3a05133350c7b136e3ca00f005c4a03" },
      path:
        "/Music/Itoshii Hito e (愛しい人へ; To the loved one) - Sachi Tainaka.mp3",
      ipfsHash: "Qmeia5QzzmLspWk2WJfU7FSHNvKd2kiEdXSoFtR9af2Qbo",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184852056343058"),
    ts: 1600602924468000,
    data: {
      name:
        "[ENGJPROMINDO] URU - REMEMBER [ Natsume Yuujinchou Movie - Utsusemi ni Musubu ].mp3",
      type: "file",
      parent: "/Music",
      size: 8384189,
      hashes: { md5: "75f82e163d83fa7521a1acbcedf2a568" },
      path:
        "/Music/[ENGJPROMINDO] URU - REMEMBER [ Natsume Yuujinchou Movie - Utsusemi ni Musubu ].mp3",
      ipfsHash: "QmdEb6LvtnEPyFJ6XiWT5a7iBpAJLGPUrcJnjtKdVbxKiP",
    },
  },
  {
    ref: q.Ref(q.Collection("files"), "277184854042345984"),
    ts: 1600602926378700,
    data: {
      name:
        'Most Emotional Music Collection - "Shiki" [ 屍鬼 - Best of Shiki].mp3',
      type: "file",
      parent: "/Music",
      size: 42663320,
      hashes: { md5: "0bc628ef9991467e4623382cb2f2c707" },
      path:
        '/Music/Most Emotional Music Collection - "Shiki" [屍鬼 - Best of Shiki].mp3',
      ipfsHash: "QmNije7GDEu21GTVHtftUQ34Attt2bd15eJozpE5VfY3ng",
    },
  },
];

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

class FileTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      isLoading: false,
    };
    let {parent} = useParams();
    let {url} = useRouteMatch();
  }

  componentDidMount() {
    this.setState({ isLoading: true });
    if(this.props.parent == '/'){
      alert("/")
      }

    this.getData(this.props.parent)
      .then((data) => this.setState({ data: data, isLoading: false }))
      .catch((error) => this.setState({ isLoading: false }));
  }
  async getData(parent) {
    return data;
  }

  render() {
    return (
      <div class="list-group">
        {this.state.data.map((file) => (
          <Link to={`${url}/${parent}`} class="list-group-item list-group-item-action" key={file.data.name}>{file.data.name}</Link>
        ))}
      </div>
    );
  }
}

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
                  return <Redirect to="/parent" />;
                }}
              />
              <Route exact strict path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/Music" component={LogIn} />
              <Route
                path="/parent/:path"
                render={({ match }) => {
                  return <FileTable parent={"/" + match.params.path} />;
                }}
              />
              <Route component={Error} />
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
