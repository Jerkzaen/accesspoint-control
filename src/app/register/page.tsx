"use client";

import axios, {AxiosError} from "axios";
import { FormEvent,useState } from "react";



function RegisterPage() {
    const [error, setError] = useState();

const handlesubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  try {
    const email = formData.get("email");
    const password = formData.get("password");
    const fullname = formData.get("fullname");

    const res = await axios.post("/api/auth/signup", {
      email: formData.get("email"),
      password: formData.get("password"),
      fullname: formData.get("fullname"),
    });
    console.log(res);
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) {
      setError(error.response?.data.message);
    }
  }
};
  return (
    <div>
      <form onSubmit={handlesubmit}>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder="username"
          name="fullname"
          className="bg-zinc-800 px-4 py-2 rounded-lg block mb-2"
        />
        <input
          type="email"
          placeholder="email"
          name="email"
          className="bg-zinc-800 px-4 py-2 rounded-lg block mb-2"
        />
        <input
          type="password"
          placeholder="password"
          name="password"
          className="bg-zinc-800 px-4 py-2 rounded-lg block mb-2"
        />
        <button className="bg-indigo-500 px-4 py-2 rounded-lg">Register</button>
      </form>
    </div>
  );
}
export default RegisterPage;
