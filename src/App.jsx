import { useEffect, useMemo, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Toast,
  ToastContainer,
  InputGroup,
} from "react-bootstrap";
import { Calendar } from "react-bootstrap-icons";

const STORAGE_KEY = "pos_categories_v1";
const getNextId = () => {
  const key = "pos_next_id_v1";
  const raw = localStorage.getItem(key);

  // jika counter valid di localStorage, pakai itu
  if (raw && !Number.isNaN(Number(raw))) {
    const next = Number(raw);
    localStorage.setItem(key, String(next + 1));
    return next;
  }

  try {
    const rawCats = localStorage.getItem(STORAGE_KEY);
    const cats = rawCats ? JSON.parse(rawCats) : initialProducts;
    const maxId =
      cats && cats.length
        ? cats.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0)
        : 0;
    const next = maxId + 1;
    // simpan counter berikutnya (next + 1) agar panggilan selanjutnya aman
    localStorage.setItem(key, String(next + 1));
    return next;
  } catch (err) {
    // fallback aman kalau parsing error
    localStorage.setItem(key, "2"); // next time will be 2
    return 1;
  }
};

export default function App() {
  const initialProducts = useMemo(
    () => [
      {
        id: 1,
        name: "Makanan",
        description: "Produk makanan siap saji",
        price: 10000,
        category: "Makanan",
        releaseDate: "2024-01-01",
        stock: 10,
        active: true,
      },
      {
        id: 2,
        name: "Minuman",
        description: "Aneka minuman dingin & hangat",
        price: 8000,
        category: "Minuman",
        releaseDate: "2024-02-01",
        stock: 20,
        active: true,
      },
    ],
    []
  );

  const [categories, setCategories] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : initialProducts;
    } catch (err) {
      return initialProducts;
    }
  });
  const releaseDateRef = useRef(null);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [releaseDate, setReleaseDate] = useState("");
  const [stock, setStock] = useState(0);
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  // toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success"); // 'success' | 'danger'

  // save ke local storage setiap ada perubahan categories
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (err) {
      console.error("Error saving to localStorage", err);
    }
  }, [categories]);

  const validate = () => {
    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const today = new Date();
    const rd = releaseDate ? new Date(releaseDate) : null;
    const parsedPrice = price === "" ? NaN : Number(price);
    const parsedStock = Number(stock);

    // name
    if (!trimmedName) newErrors.name = "Nama Produk wajib diisi.";
    else if (trimmedName.length < 3) newErrors.name = "Minimal 3 karakter.";
    else if (trimmedName.length > 100)
      newErrors.name = "Maksimal 100 karakter.";
    else {
      const isDuplicate = categories.some(
        (c) =>
          c.name.toLowerCase() === trimmedName.toLowerCase() &&
          c.id !== editingId
      );
      if (isDuplicate) newErrors.name = "Nama Produk sudah ada.";
    }

    // description (optional but if given min 20)
    if (trimmedDesc) {
      if (trimmedDesc.length < 20)
        newErrors.description = "Deskripsi minimal 20 karakter.";
      if (trimmedDesc.length > 1000)
        newErrors.description = "Deskripsi terlalu panjang.";
    }

    // price
    if (String(price).trim() === "") newErrors.price = "Harga wajib diisi.";
    else if (Number.isNaN(parsedPrice))
      newErrors.price = "Harga harus numerik.";
    else if (parsedPrice < 0) newErrors.price = "Harga minimal 0.";

    // category select
    if (!category) newErrors.category = "Kategori utama wajib dipilih.";

    // release date
    if (releaseDate) {
      if (!(rd instanceof Date) || Number.isNaN(rd.getTime()))
        newErrors.releaseDate = "Format tanggal tidak valid.";
      else if (rd > today)
        newErrors.releaseDate = "Tanggal rilis tidak boleh di masa depan.";
    }

    // stock
    if (Number.isNaN(parsedStock)) newErrors.stock = "Stok harus numerik.";
    else if (parsedStock < 0) newErrors.stock = "Stok minimal 0.";
    else if (parsedStock > 1000000) newErrors.stock = "Stok terlalu besar.";

    return newErrors;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setReleaseDate("");
    setStock(0);
    setActive(true);
    setErrors({});
    setEditingId(null);
  };

  const showToastMsg = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length !== 0) {
      showToastMsg("Periksa kembali input Anda.", "danger");
      return;
    }

    if (editingId === null) {
      const newCategory = {
        id: getNextId(),
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        releaseDate: releaseDate || null,
        stock: Number(stock),
        active: Boolean(active),
      };
      setCategories((prev) => [newCategory, ...prev]);
      resetForm();
      showToastMsg("Produk berhasil ditambahkan.", "success");
    } else {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: name.trim(),
                description: description.trim(),
                price: Number(price),
                category,
                releaseDate: releaseDate || null,
                stock: Number(stock),
                active: Boolean(active),
              }
            : c
        )
      );
      resetForm();
      showToastMsg("Produk berhasil diperbarui.", "success");
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setPrice(cat.price ?? "");
    setCategory(cat.category || "");
    setReleaseDate(cat.releaseDate || "");
    setStock(cat.stock ?? 0);
    setActive(Boolean(cat.active));
    setErrors({});
  };

  const handleDelete = (id) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const ok = window.confirm(`Hapus Produk "${target.name}"?`);
    if (!ok) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
    showToastMsg("Produk berhasil dihapus.", "success");
  };

  const descriptionCount = `${description.length}/1000`;
  const isEditing = editingId !== null;

  // contoh opsi kategori (bisa kamu ubah)
  const categoryOptions = [
    "Elektronik",
    "Pakaian",
    "Makanan",
    "Minuman",
    "Rumah Tangga",
    "Lainnya",
  ];

  return (
    <Container className="py-4">
      <Row>
        <Col lg={5}>
          <Card className="mb-4">
            <Card.Header as="h5">
              {isEditing ? "Edit Produk" : "Tambah Produk"}
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-2" controlId="categoryName">
                  <Form.Label>Nama Produk</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: Sembako"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    isInvalid={!!errors.name}
                    maxLength={100}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-2" controlId="categoryDescription">
                  <Form.Label>Deskripsi (opsional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Tulis deskripsi Produk (min 20 karakter)"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description)
                        setErrors((prev) => ({
                          ...prev,
                          description: undefined,
                        }));
                    }}
                    isInvalid={!!errors.description}
                    maxLength={1000}
                  />
                  <div className="d-flex justify-content-between">
                    <Form.Text muted>
                      Berikan deskripsi singkat Produk.
                    </Form.Text>
                    <Form.Text muted>{descriptionCount}</Form.Text>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-2" controlId="categoryPrice">
                  <Form.Label>Harga (Rp)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Harga produk"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price)
                        setErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    isInvalid={!!errors.price}
                    min={0}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.price}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-2" controlId="categorySelect">
                  <Form.Label>Kategori Utama</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (errors.category)
                        setErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                    isInvalid={!!errors.category}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.category}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-2" controlId="categoryRelease">
                  <Form.Label>Tanggal Rilis</Form.Label>
                  <div style={{ position: "relative" }}>
                    <Form.Control
                      type="date"
                      value={releaseDate}
                      onChange={(e) => {
                        setReleaseDate(e.target.value);
                        if (errors.releaseDate) {
                          setErrors((prev) => ({
                            ...prev,
                            releaseDate: undefined,
                          }));
                        }
                      }}
                      isInvalid={!!errors.releaseDate}
                      max={new Date().toISOString().split("T")[0]}
                      required
                      // hilangkan id yang menyebabkan warning, pakai ref
                      ref={releaseDateRef}
                      style={{ paddingRight: "40px" }} // kasih ruang buat ikon
                    />
                    {/* Ikon kalender di kanan */}
                    <Calendar
                      size={18}
                      color="gray"
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        // fokus / showPicker via ref, lebih React-friendly
                        releaseDateRef.current?.showPicker?.() ||
                          releaseDateRef.current?.focus?.();
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.releaseDate}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>

                <Form.Group className="mb-2" controlId="categoryStock">
                  <Form.Label>Stok Tersedia</Form.Label>
                  <Form.Control
                    type="number"
                    value={stock}
                    onChange={(e) => {
                      setStock(e.target.value);
                      if (errors.stock)
                        setErrors((prev) => ({ ...prev, stock: undefined }));
                    }}
                    isInvalid={!!errors.stock}
                    min={0}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.stock}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="categoryActive">
                  <Form.Check
                    type="switch"
                    label="Produk Aktif"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant={isEditing ? "primary" : "success"}
                  >
                    {isEditing ? "Simpan Perubahan" : "Tambah Produk"}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resetForm}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card>
            <Card.Header as="h5">Daftar Produk</Card.Header>
            <Card.Body className="p-0">
              <Table striped bordered hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 40 }} className="text-center">
                      No
                    </th>
                    <th>Nama</th>
                    <th>Dekskripsi</th>
                    <th>Harga</th>
                    <th>Kategori</th>
                    <th>Tanggal Rilis</th>
                    {}
                    <th style={{ width: 120 }}>Stok</th>
                    <th style={{ width: 140 }}>Status</th>
                    <th style={{ width: 200 }} className="text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Belum ada data Produk.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat, idx) => (
                      <tr key={cat.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td>
                          <strong>{cat.name}</strong>
                        </td>
                        <td className="text-muted" style={{ fontSize: 14 }}>
                          {cat.description || "-"}
                        </td>
                        <td>Rp {Number(cat.price).toLocaleString()}</td>
                        <td>{cat.category}</td>
                        <td>{cat.releaseDate ? cat.releaseDate : "-"}</td>
                        {}
                        <td>{cat.stock}</td>
                        <td>{cat.active ? "Aktif" : "Tidak aktif"}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleEdit(cat)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(cat.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Header closeButton>
            <strong className="me-auto">Notifikasi</strong>
            <small>Baru saja</small>
          </Toast.Header>
          <Toast.Body className={toastVariant === "danger" ? "text-white" : ""}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
