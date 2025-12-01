import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';

const App = () => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const [task, setTask] = useState([]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // notes ko backend se laane ka helper
  const loadNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // app open hote hi check karo already login hai ya nahi
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
          await loadNotes();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.message || 'Login failed');
        return;
      }

      const data = await res.json();
      setUser(data.username);
      setUsername('');
      setPassword('');
      await loadNotes();
    } catch (err) {
      console.error(err);
      setAuthError('Something went wrong');
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setTask([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ADD NOTE
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, details }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setTask((prev) => [...prev, newNote]);
        setTitle('');
        setDetails('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE NOTE
  const deleteNote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setTask((prev) => prev.filter((note) => note.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Checking login...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-zinc-900/95 border border-zinc-800 shadow-2xl p-10 rounded-3xl flex flex-col gap-5 w-[360px]"
        >
          <h1 className="text-3xl font-bold text-center mb-1">Login</h1>

          <input
            type="text"
            placeholder="Username"
            className="px-4 py-2 rounded-lg w-full outline-none bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-400 focus:border-zinc-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="px-4 py-2 rounded-lg w-full outline-none bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-400 focus:border-zinc-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {authError && (
            <p className="text-red-400 text-sm text-center">{authError}</p>
          )}

          <button
            type="submit"
            className="bg-white text-black font-semibold py-2 rounded-lg active:scale-95 transition-transform"
          >
            Login
          </button>

          <p className="text-xs text-gray-400 text-center mt-1">
            Demo user: <span className="font-semibold text-gray-200">shubh / 1234</span>
          </p>
        </form>
      </div>
    );
  }

  // NOTES SCREEN
  return (
    <div className="h-screen lg:flex bg-black text-white">
      <form
        onSubmit={submitHandler}
        className="flex gap-4 lg:w-1/2 p-10 flex-col items-start"
      >
        <div className="w-full flex justify-between items-center">
          <h1 className="text-4xl mb-2 font-bold">Add Notes</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">
              Logged in as <span className="font-semibold">{user}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 text-xs rounded-lg active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Enter Notes Heading"
          className="px-5 w-full font-medium py-2 border border-zinc-700 bg-zinc-900 rounded-lg outline-none text-white placeholder:text-zinc-500 focus:border-zinc-400"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
        />

        <textarea
          className="px-5 w-full font-medium h-32 py-2 border border-zinc-700 bg-zinc-900 rounded-lg outline-none text-white placeholder:text-zinc-500 focus:border-zinc-400 resize-none"
          placeholder="Write Details here"
          value={details}
          onChange={(e) => {
            setDetails(e.target.value);
          }}
        />

        <button className="bg-white active:scale-95 font-medium w-full outline-none text-black px-5 py-2 rounded-lg">
          Add Note
        </button>
      </form>

      <div className="lg:w-1/2 lg:border-l-2 border-zinc-800 p-10">
        <h1 className="text-4xl font-bold">Recent Notes</h1>
        <div className="flex flex-wrap items-start justify-start gap-5 mt-6 h-[90%] overflow-auto">
          {task.map((elem) => (
            <div
              key={elem.id}
              className="flex justify-between flex-col items-start relative h-52 w-40 bg-cover rounded-xl text-black pt-9 pb-4 px-4 shadow-lg bg-[url('https://static.vecteezy.com/system/resources/previews/037/152/677/non_2x/sticky-note-paper-background-free-png.png')]"
            >
              <div>
                <h3 className="leading-tight text-lg font-bold">
                  {elem.title}
                </h3>
                <p className="mt-2 leading-tight text-xs font-semibold text-gray-700">
                  {elem.details}
                </p>
              </div>
              <button
                onClick={() => {
                  deleteNote(elem.id);
                }}
                className="w-full cursor-pointer active:scale-95 bg-red-500 py-1 text-xs rounded font-bold text-white mt-3"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
