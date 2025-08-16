import { use, useEffect, useState } from "react";
import api from "../../api/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { createRoot } from "react-dom/client";
import Recu from "./recu";
import html2pdf from "html2pdf.js";
import DataTable from "react-data-table-component";

const Virement = () => {
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
  const [virement, setVirement] = useState({
    type: "Virement",
    date: new Date().toLocaleString("fr-FR"),
    titulaire: "",
    montant: 0,
    numCompte: "",
    motif: "",
    destinataire: "",
    codePin: "",
  });

  const [numCompte, setNumCompte] = useState("");
  const [virementtData, setVirementData] = useState([]);

  const columns = [
    {
      name: "Date",
      selector: (row) => formatDate(row.DateOp),
      sortable: true,
    },
    {
      name: "Destinataire",
      selector: (row) => row.NumDest.replace(/(.{4})/g, "$1 ").trim(),
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
        // style={{
        //   padding: "5px",
        //   width: "70px",
        //   backgroundColor: "green",
        //   borderRadius: "5px",
        //   color: "white",
        // }}
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
        virement.numCompte = rep.data.client.NumCompte;
        virement.titulaire = user.nom + " " + user.prenom;
        virement.date = new Date().toLocaleString("fr-FR");
        setNumCompte(rep.data.client.NumCompte);
      })
      .catch((err) => {
        console.log("Compte non trouve: ", err);
      });
  }, [user]);

  const loadVirementData = () => {
    api.get(`/operations/virement/${numCompte}`).then((rep) => {
      setVirementData(rep.data);
    });
  };

  const resetData = () => {
    setVirement({
      type: "Virement",
      date: new Date().toLocaleString("fr-FR"),
      titulaire: "",
      montant: 0,
      numCompte: "",
      motif: "",
      destinataire: "",
      codePin: "",
    });
  };

  useEffect(() => {
    loadVirementData();
  }, [numCompte]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVirement({ ...virement, [name]: value });
  };

  const doVirement = () => {
    const dataToSend = {
      ...virement,
      destinataire: virement.destinataire.replace(/\s/g, ""),
    };
    api
      .post("/operations/virement", dataToSend)
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
              text: "OK",
            },
          },
        }).then(() => {
          swal({
            title: "Impression du reçu",
            text: "Souhaitez-vous imprimer le reçu ?",
            icon: "info",
            buttons: {
              cancel: {
                text: "Non",
                visible: true,
                className: "btn btn-secondary",
              },
              confirm: {
                text: "Oui",
                className: "btn btn-primary",
              },
            },
          }).then((willPrint) => {
            if (willPrint) {
              generatePDF();
            }
          });
          loadVirementData();
          resetData();
        });
      })
      .catch((err) => {
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
    { value: "Approuver", label: "Approuver" },
    { value: "Refuse", label: "Refuse" },
  ];

  const [numDest, setNumDest] = useState("");

  const handleChangeCompteDest = (e) => {
    let input = e.target.value;

    input = input.replace(/\D/g, "");

    input = input.match(/.{1,4}/g);

    if (input) {
      input = input.join(" ");
    } else {
      input = "";
    }

    setNumDest(input);

    setVirement((prev) => ({
      ...prev,
      destinataire: input,
    }));
  };

  const generatePDF = () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const root = createRoot(div);
    root.render(<Recu {...virement} />);

    setTimeout(() => {
      const opt = {
        margin: 1,
        filename: `recu${virement.numCompte}.pdf`,
        html2canvas: {
          scale: 2,
          logging: true,
          useCORS: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      };

      html2pdf()
        .from(div)
        .set(opt)
        .save()
        .then(() => {
          root.unmount();
          document.body.removeChild(div);
        })
        .catch(() => {
          console.error("Erreur lors de la génération du PDF");
          root.unmount();
          document.body.removeChild(div);
        });
    }, 1000);
  };

  const formatDate = (date) => {
    return date.split("T")[0];
  };

  return (
    <div className="container-data">
      <form className="withdraw-form">
        <h2>Formulaire de Virement</h2>
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
          type="text"
          name="destinataire"
          value={numDest}
          onChange={handleChangeCompteDest}
          maxLength={19}
          placeholder="Numéro de compte destinataire"
        />
        <input
          type="number"
          name="montant"
          value={virement.montant}
          onChange={handleChange}
          placeholder="Montant à transferer"
        />
        <textarea
          placeholder="Motif du virement"
          name="motif"
          value={virement.motif}
          onChange={handleChange}
        ></textarea>
        <input
          type="password"
          name="codePin"
          value={virement.codePin}
          placeholder="Code PIN"
          inputMode="numeric" // affiche le pavé numérique sur mobile
          pattern="[0-9]*" // hint pour le navigateur
          maxLength={4} // si le code PIN est à 4 chiffres
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/\D/, "");
            setVirement({ ...virement, codePin: onlyNums });
          }}
        />
        <button
          onClick={() => {
            doVirement();
          }}
          type="button"
        >
          Effectuer le virement
        </button>
        {/* <button type="button">Vider</button> */}
      </form>

      <div className="transaction-history">
        <div className="history-toolbar">
          <h2>Historique des transactions</h2>
          {/* <div className="actions">
            <button onClick={generatePDF}>📄 Exporter en PDF</button>
            <button>📊 Exporter en Excel</button>
            <button>🖨️ Imprimer</button>
          </div> */}
        </div>

        {/* <div className="transaction-list">
          {virementtData && virementtData.length > 0 ? (
            virementtData.map((item) => (
              <div key={item.NumOp} className="transaction-row">
                <div className="transaction-date">
                  {item.NumDest.replace(/(.{4})/g, "$1 ").trim()}
                </div>
                <div className="transaction-date">{item.DateOp}</div>
                <div className="transaction-amount">
                  {item.Montant.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  Ar
                </div>
                <div className="transaction-date">{item.StatusP}</div>
                <div className="transaction-action">
                  <FontAwesomeIcon
                    onClick={() => deleteHistorique(item.NumOp)}
                    icon={faTrash}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="no-transaction">Aucune transaction disponible.</div>
          )}
        </div> */}

        {/* <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Destinataire</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {virementtData && virementtData.length > 0 ? (
              virementtData.map((item) => (
                <tr key={item.NumOp}>
                  <td>{formatDate(item.DateOp)}</td>
                  <td>{item.NumDest.replace(/(.{4})/g, "$1 ").trim()}</td>
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
            data={virementtData}
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

export default Virement;
