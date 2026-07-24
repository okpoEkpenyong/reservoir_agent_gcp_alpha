import React from "react";
import styles from "../App.module.css";
import { Button, Container } from "react-bootstrap";
import { partners_intro } from "../utils/data";
import { DescriptionCard } from "./Card";

export const Shared = ({ imgsrc, path, visit, btname, subtitle }) => {
  return (
    <Container fluid className={styles.appHeader}>
      <img src={imgsrc} className={styles.appLogo} alt="logo" />
      {path === "home" && (
        <>
          <h1 className={styles.exzingWords}>
            <strong>
              {" "}
              Feel the gust of<strong className={styles.exzing}>
                {" "}
                EXzing Innovation
              </strong>{" "}
            </strong>
          </h1>
          {subtitle && <h5 className={styles.subtitle}>{subtitle}</h5>}
          <h4 className={styles.wego}>
            break things and build better ones..
          </h4>
          <div>
            <Button
              variant="outline-info"
              href={visit}
            >
              {" "}
              {btname}
            </Button>{" "}
          </div>
        </>
      )}
      {path === "partner" && (

        <DescriptionCard desc={true} arr={partners_intro} />
      )}
    </Container>
  );
};
