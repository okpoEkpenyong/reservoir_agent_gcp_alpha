// src\components\Service.js

import React from "react";
import { Card, Container } from "react-bootstrap";
import styles from "../App.module.css";
import { CustomCard } from "./Card";
import { services_image } from "../utils/data";
import { DescriptionCard } from "./Card";

export function About() {
  return (
    <Container fluid className={styles.container}>
        <h2 className={styles.subtitles}>About Exzing</h2>
        <DescriptionCard
          desc={true}
          arr={[
            {
              media_id: 10,
              media_title: "Why Exzing?",
              media_desc: `Exzing exists to enable ease and flexibilty in business by building user-friendly
                technical and software solutions. Our current solution drive aims to address  Africa’s critical climate tech gap. 
                We design tools for underserved regions with urgency, innovation, and integrity. 
                Whether you’re a startup, established multinational company, a government agency, or a port authority, we provide data-driven platforms 
                that help supports cleaner energy and promote sustainable decision-making.`,
            },
          ]}
        />

    </Container>
  );
}

