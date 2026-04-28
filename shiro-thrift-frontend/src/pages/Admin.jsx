import { useEffect, useState } from "react";
import API from "../services/api";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get("/products")
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteProduct = (id) => {
    if (window.confirm("Remove this piece from the collection?")) {
      API.delete(`/products/${id}`).then(load);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await API.post("/product/upload", formData);
    return res.data.image_url;
  };

  return (
    <div className="admin">
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">Management Console</p>
          <h1 className="admin-title">Collection Admin</h1>
        </div>
        <button className="admin-add-btn">+ Add New Piece</button>
      </div>

      <div className="admin-divider" />

      {loading ? (
        <p className="admin-loading">Loading collection...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Price (KES)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="admin-row">
                  <td className="admin-name">
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} className="admin-thumb" />
                    )}
                    {p.name}
                  </td>
                  <td className="admin-cat">{p.category}</td>
                  <td className="admin-price">{Number(p.price).toLocaleString()}</td>
                  <td>
                    <button
                      className="admin-delete-btn"
                      onClick={() => deleteProduct(p.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}