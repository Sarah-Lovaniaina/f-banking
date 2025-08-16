import axios from "axios";
import { useState, useEffect } from "react";
import api from "../../api/api";
import swal from "sweetalert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPrint,
  faFilePdf,
  faSave,
  faFileExcel,
  faShare,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import DataTable from "react-data-table-component";

const Pret = () => {
  const customStyles = {
    rows: {
      style: {
        minHeight: "60px",
        fontSize: "15px",
        borderBottom: "1px solid #eee",
      },
    },
    headCells: {
      style: {
        backgroundColor: "#009879",
        color: "white",
        fontSize: "15px",
        fontWeight: "600",
        textTransform: "uppercase",
      },
    },
    cells: {
      style: {
        padding: "12px",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #eee",
        padding: "10px",
        fontSize: "15px",
        // justifyContent: "center",
      },
    },
  };

  const [user, setUser] = useState({});
  const [clientInfo, setClientInfo] = useState({});
  const [pret, setPret] = useState({
    montant: 0,
    numCompte: "",
    duree: "",
    motif: "",
    codePin: "",
    revenu: 0,
  });

  const [numCompte, setNumCompte] = useState("");
  const [pretData, setPretData] = useState([]);

  const columns = [
    {
      name: "Date",
      selector: (row) => formatDate(row.DateOp),
      sortable: true,
    },
    {
      name: "Motif",
      selector: (row) => row.Motif,
      sortable: true,
    },
    {
      name: "Montant",
      selector: (row) =>
        `${row.Montant.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} Ar`,
      sortable: true,
      // right: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <div
          style={{
            padding: "4px",
            width: "70px",
            borderStyle: "none",
            borderRadius: "7px",
            color: "white",
            backgroundColor:
              row.StatusP === "Accepte"
                ? "green"
                : row.StatusP === "Refuse"
                ? "red"
                : "black",
            fontWeight: "bold",
          }}
        >
          {row.StatusP}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <FontAwesomeIcon
          icon={faTimes}
          style={{ color: "red", fontSize: "20px", cursor: "pointer" }}
          onClick={() => deleteHistorique(row.NumOp)}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const paginationData = {
    rowsPerPageText: "Lignes par page",
    rangeSeparatorText: "sur",
    selectAllRowsItem: true,
    selectAllRowsItemText: "Tous",
  };

  useEffect(() => {
    api
      .get("/utilisateurs/me")
      .then((rep) => {
        setUser(rep.data.user);
      })
      .catch((err) => {
        console.log("Uitlisateur non connecte: ", err);
      });
  }, []);

  useEffect(() => {
    api
      .get(`/utilisateurs`)
      .then((rep) => {
        setClientInfo(rep.data.client);
        pret.numCompte = rep.data.client.NumCompte;
        setNumCompte(rep.data.client.NumCompte);
      })
      .catch((err) => {
        console.log("Compte non trouve: ", err);
      });
  }, []);

  const loadPretData = () => {
    api.get(`/operations/pret/${numCompte}`).then((rep) => {
      setPretData(rep.data);
    });
  };

  const resetData = () => {
    setPret({
      montant: "",
      numCompte: "",
      duree: "",
      motif: "",
      revenu: "",
      codePin: "",
    });
  };

  useEffect(() => {
    loadPretData();
  }, [numCompte]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPret({ ...pret, [name]: value });
  };

  const doPret = () => {
    api
      .post("/operations/pret", pret)
      .then((rep) => {
        if (!rep.data.success) {
          swal({
            title: "Erreur",
            text: rep.data.message || "Une erreur s'est produite",
            icon: "error",
            buttons: {
              confirm: {
                className: "btn btn-danger",
              },
            },
          });
          return;
        }

        swal({
          title: "Succès",
          text: rep.data.message,
          icon: "success",
          buttons: {
            confirm: {
              className: "btn btn-success",
            },
          },
        });
        loadPretData();
        resetData();
      })
      .catch((err) => {
        console.log(err.message);
        swal({
          title: "Erreur",
          text: err.response?.data?.message || "Une erreur s'est produite",
          icon: "error",
          buttons: {
            confirm: {
              className: "btn btn-danger",
            },
          },
        });
      });
  };

  const deleteHistorique = (numOp) => {
    swal({
      title: "Êtes-vous sûr ?",
      text: "Une fois supprimé, vous ne pourrez plus récupérer cet information !",
      icon: "warning",
      buttons: {
        confirm: {
          text: "Oui",
          // className: "btn btn-success",
        },
        cancel: {
          text: "Non",
          visible: true,
          // className: "btn btn-danger",
        },
      },
    }).then((willDelete) => {
      if (willDelete) {
        api.delete(`operations/historique/${numOp}`).then((rep) => {
          if (rep.data.success) {
            swal(`${rep.data.message}`, {
              icon: "success",
              buttons: {
                confirm: {
                  className: "btn btn-success",
                },
              },
            });
            loadPretData();
          } else {
            swal(`${rep.data.message}`, {
              icon: "error",
              buttons: {
                confirm: {
                  className: "btn btn-success",
                },
              },
            });
            loadPretData();
          }
        });
      } else {
        swal.close();
      }
    });
  };

  const options = [
    { value: "En attente", label: "En attente" },
    { value: "Accepte", label: "Accepter" },
    { value: "Refuse", label: "Refuser" },
  ];

  const [selectedStatus, setSelectedStatus] = useState(null);

  const filteredPretData = selectedStatus
    ? pretData.filter((item) => item.StatusP === selectedStatus)
    : pretData;

  const formatDate = (date) => {
    return date.split("T")[0];
  };

  return (
    <div className="container-data">
      {/* <h2>Formulaire de Demande de Pret</h2> */}

      <form className="withdraw-form">
        <h2>Formulaire de demande de pret</h2>
        <input
          style={{ backgroundColor: "#fffcc8" }}
          type="text"
          placeholder="Nom"
          disabled
          value={user.nom + " " + user.prenom}
        />
        <input
          style={{ backgroundColor: "#fffcc8" }}
          disabled
          type="text"
          name="numCompte"
          value={
            clientInfo.NumCompte
              ? clientInfo.NumCompte.replace(/(.{4})/g, "$1 ").trim()
              : ""
          }
          placeholder="Numéro de compte"
        />
        <input
          type="number"
          name="montant"
          value={pret.montant}
          onChange={handleChange}
          placeholder="Montant du pret demande"
          min="0"
        />
        <input
          type="number"
          name="duree"
          value={pret.duree}
          onChange={handleChange}
          placeholder="Duree (en mois)"
        />
        <input
          type="number"
          name="revenu"
          value={pret.revenu}
          onChange={handleChange}
          placeholder="Revenu mensuel"
        />
        <textarea
          name="motif"
          value={pret.motif}
          onChange={handleChange}
          placeholder="Motif de la demande"
        ></textarea>

        <input
          type="password"
          name="codePin"
          value={pret.codePin}
          placeholder="Code PIN"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/\D/, "");
            setPret({ ...pret, codePin: onlyNums });
          }}
        />

        <button
          type="button"
          onClick={() => {
            doPret();
          }}
          style={{
            fontSize: "20px",
          }}
        >
          <FontAwesomeIcon icon={faShare} />
          &nbsp;&nbsp; Envoyer
        </button>
      </form>

      <div className="transaction-history">
        <div className="history-toolbar">
          <div
            className="flex"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            {/* <h2>Historique de demande</h2> */}
            <div style={{ width: "250px", marginBottom: "15px" }}>
              <Select
                styles={{
                  control: (base) => ({
                    ...base,
                    width: 250,
                  }),
                }}
                options={options}
                placeholder="Filtrer par statut"
                onChange={(option) =>
                  setSelectedStatus(option ? option.value : null)
                }
                isClearable
              />
            </div>
          </div>

          {/* <div className="actions">
            <button>
              <FontAwesomeIcon icon={faFilePdf} />
            </button>
            <button>
              <FontAwesomeIcon icon={faFileExcel} />
            </button>
            <button>
              <FontAwesomeIcon icon={faPrint} />
            </button>
          </div> */}
        </div>

        {/* <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Motif</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPretData && filteredPretData.length > 0 ? (
              filteredPretData.map((item) => (
                <tr key={item.NumOp}>
                  <td>{formatDate(item.DateOp)}</td>
                  <td>{item.Motif}</td>
                  <td>
                    {item.Montant.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Ar
                  </td>
                  <td>{item.StatusP}</td>
                  <td
                    style={{
                      color: "red",
                      fontSize: "20px",
                      textAlign: "center",
                    }}
                  >
                    <FontAwesomeIcon
                      onClick={() => deleteHistorique(item.NumOp)}
                      icon={faTimes}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    fontStyle: "italic",
                    padding: "20px",
                  }}
                >
                  Aucune donnée trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table> */}

        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <DataTable
            columns={columns}
            data={filteredPretData}
            pagination
            responsive
            highlightOnHover
            customStyles={customStyles}
            noDataComponent="Aucune donnée trouvée."
            paginationComponentOptions={paginationData}
          />
        </div>
      </div>
    </div>
  );
};

export default Pret;
