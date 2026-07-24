import React from "react";
import { Container } from "react-bootstrap";
import styles from "../App.module.css";

export const Footer = () => {
  return (
    <Container fluid className={styles.footer}>
      <p className="text-lg">
        exzing © {new Date().getFullYear().toString()}. All rights reserved
      </p>
    </Container>
  );
};
