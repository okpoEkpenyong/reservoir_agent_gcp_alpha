// src\components\Service.js

import React from "react";
import { Card, Container } from "react-bootstrap";
import styles from "../App.module.css";
import { CustomCard } from "./Card";
import { services_image } from "../utils/data";

export function Services() {
  return (
    <Container fluid className={styles.container}>
      <Card border="warning" className={styles.containerCard}>
        <h2 className={styles.subtitles}>What We Build</h2>
        <p className={styles.subtitles}>
            From CO₂ intelligence platforms to blockchain-backed climate data and Azure ML-powered seismic tools, 
             Exzing delivers sustainable tech built for real-world impact.
       </p>
        <CustomCard arr={services_image} media={"image"} desc={false} />;
      </Card>
    </Container>
  );
}

