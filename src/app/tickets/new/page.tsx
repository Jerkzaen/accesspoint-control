// Funcion de la pagina de formulario de tickets
function FormPage() {
  return (
    <div className="h-[calc(100vh-7rem)] flex justify-center items-center">
      <form>
        <input
          type="text"
          name="title"
          placeholder="Titulo"
          className=" bg-gray-800 border-2 w-full p-4 rounded-lg my-4"
        />
        <textarea
          name="description"
          rows={3}
          placeholder="Descripcion"
          className=" bg-gray-800 border-2 w-full p-4 rounded-lg my-4"
        ></textarea>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg">
          Guardar
        </button>
      </form>
    </div>
  );
}
// Exportar la funcion de la pagina de formulario de tickets
export default FormPage;
