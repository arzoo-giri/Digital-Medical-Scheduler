import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { backendUrl, setToken, loadUserProfileData } = useContext(AppContext);
  const navigate = useNavigate();

  const [state, setState] = useState("Sign Up"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const validateName = (name) => /^[A-Za-z ]{3,}$/.test(name.trim());

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(password);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (state === "Sign Up") {
      if (!name.trim()) return toast.error("Name cannot be empty.");
      if (!validateName(name))
        return toast.error(
          "Name must be at least 3 letters and contain only alphabets."
        );

      if (!email.trim()) return toast.error("Email cannot be empty.");
      if (!validateEmail(email)) return toast.error("Invalid email format.");

      if (!password.trim()) return toast.error("Password cannot be empty.");
      if (!validatePassword(password))
        return toast.error(
          "Password must be 8+ chars with uppercase, lowercase, number & special char."
        );
    }

    if (state === "Login") {
      if (!email.trim()) return toast.error("Email cannot be empty.");
      if (!validateEmail(email)) return toast.error("Invalid email format.");
      if (!password.trim()) return toast.error("Password cannot be empty.");
      if (password.length < 8)
        return toast.error("Password must be at least 8 characters long.");
    }

    try {
      let response;
      if (state === "Sign Up") {
        response = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
        });
      } else {
        response = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });
      }

      const { data } = response;

      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        await loadUserProfileData();
        toast.success(
          state === "Sign Up"
            ? "Account created successfully!"
            : "Logged in successfully!"
        );
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="min-h-[80vh] flex items-center justify-center"
    >
      <div className="flex flex-col gap-3 p-8 min-w-[340px] sm:min-w-96 rounded-xl shadow-lg bg-white text-zinc-600 text-sm">
        <p className="text-2xl font-semibold">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </p>
        <p>
          Please {state === "Sign Up" ? "sign up" : "log in"} to book
          appointments
        </p>

        {state === "Sign Up" && (
          <div className="w-full">
            <p>Full Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              placeholder="John Doe"
            />
          </div>
        )}

        <div className="w-full">
          <p>Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            placeholder="example@mail.com"
          />
        </div>

        <div className="w-full">
          <p>Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-white w-full py-2 rounded-md text-base mt-2"
        >
          {state === "Sign Up" ? "Create Account" : "Login"}
        </button>

        <p className="mt-2 text-sm">
          {state === "Sign Up"
            ? "Already have an account?"
            : "Create a new account?"}{" "}
          <span
            onClick={() => setState(state === "Sign Up" ? "Login" : "Sign Up")}
            className="text-primary underline cursor-pointer"
          >
            {state === "Sign Up" ? "Login here" : "Click here"}
          </span>
        </p>
      </div>
    </form>
  );
};

export default Login;
