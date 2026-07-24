import React from "react";
import ms_dark from "../../src/images/ms-dark.png";
import styles from "../App.module.css";
import { Shared } from "./Shared";
import { Container, Row, Col, Card, Button} from "react-bootstrap";
import { partners_intro } from "../utils/data";
import { DescriptionCard } from "./Card";

export const Partner = () => {
  return (
    <Container fluid className={styles.container}>
      <Card border="warning" className={styles.containerCard}>
        <h2 className={styles.subtitles}>Our Partners</h2>
        <Shared imgsrc={ms_dark} path="partner" />
        {/* <DescriptionCard desc={true} arr={partners_intro} />; */}
      </Card>
    </Container>
  );
};


export const PartnerSection = () => {
  return (
    <Container className="py-5">
      <Row className="g-4">
        {partners_intro.map((partner, idx) => (
          <Col
            key={idx}
            xs={12}
            sm={6}
            md={4}
            lg={3}
            className="d-flex align-items-stretch"
          >
            <Card
              className={`${styles.partnerCard} shadow-sm border-0`}
              style={{
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }}
            >
              <Card.Img
                variant="top"
                src={partner.imgsrc}
                alt={partner.title}
                style={{ objectFit: "cover", height: "180px" }}
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fw-bold text-center">
                  {partner.title}
                </Card.Title>
                <Card.Text className="text-muted" style={{ flexGrow: 1 }}>
                  {partner.description}
                </Card.Text>
                <Button
                  variant="info"
                  href={partner.link}
                  target="_blank"
                  className="mt-auto"
                  style={{
                    borderRadius: "30px",
                    fontWeight: "bold",
                  }}
                >
                  Learn More
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

