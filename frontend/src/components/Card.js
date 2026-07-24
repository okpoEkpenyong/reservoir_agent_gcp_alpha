// src\components\Card.js

import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import styles from "../App.module.css";
import { containerStyles } from "../styles/common";

export function CustomCard({ arr, media, desc, slider }) {
  return (
    <Row xs={1} md={2} className="g-4">
      {Array.from(arr).map((value, idx) => {
        console.log({ idx, value, media });
        return (
          <Col key={value?.media_id}>
            <Card border="warning" className={styles.card}>
              {media === "image" && (
                <Card.Img variant="top" src={value?.media_name} />
              )}
              {media === "video" && (
                <div style={containerStyles}>
                  <iframe
                    width="80%"
                    height="90%"
                    title={value?.media_title}
                    src={value?.media_src}
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <Card.Body>
                <Card.Title>{value?.media_title}</Card.Title>
              </Card.Body>
              {desc && (
                <Card.Body>
                  <Card.Text>{value?.media_desc}</Card.Text>
                </Card.Body>
              )}
              <Card.Text dangerouslySetInnerHTML={{ __html: value?.media_desc }} />
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}



export function DescriptionCard({ desc, arr }) {
  return (
    <Row xs={1} md={1}>
      {Array.from(arr).map((value, idx) => {
        return (
          <Col key={value?.media_id}>
            <Card border="warning" className={styles.card}>
              {/* Optional Image */}
              {value?.media_img && (
                <Card.Img
                  variant="bottom"
                  src={value.media_img}
                  alt={value?.media_title || "Card image"}
                  className={styles.cardImage}
                />
              )}

              <Card.Body>
                <Card.Title>{value?.media_title}</Card.Title>
              </Card.Body>

              {desc && (
                <Card.Body>
                  <Card.Text
                    dangerouslySetInnerHTML={{
                      __html: value?.media_desc
                    }}
                  />
                </Card.Body>
              )}
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
