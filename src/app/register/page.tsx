function RegisterPage() {
  return (
    <div>
      <form>
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
        <button className="bg-black">Register</button>
      </form>
    </div>
  );
}
export default RegisterPage;
