import React, { useContext, useState } from "react";
import { SocialIcon } from "react-social-icons";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import { MessageContext } from "../context/MessageProvider";
import { getRandomPass } from "../utils/passwordGen";
import { Card, Container, Row } from "react-bootstrap";
import styles from "../App.module.css";

export const ContactForm = () => {
  const [validated, setValidated] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const { register } = useContext(MessageContext);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    const password = getRandomPass(10);
    event.preventDefault();
    const isFormValid = form.checkValidity();

    setValidated(true);
    setIsFormValid(isFormValid);
    console.log({ form, isFormValid });

    isFormValid && register(email, password, phoneNumber, fullName, message);
  };

  return (
    <>
      <Container fluid className={styles.container}>
        <Row xs={1} md={2} className="g-5">
          <Col>
            <Card border="warning" className={styles.card}>
              <Card.Body>
                <Card.Title className={styles.contactUs}>Contact Us</Card.Title>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                  <Form.Group as={Col} md="15" controlId="validationCustom01">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <br />
                  </Form.Group>
                  <Form.Group as={Col} md="15" controlId="validationCustom02">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      required
                      type="email"
                      placeholder="Enter a valid email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <br />
                  </Form.Group>
                  <Form.Group as={Col} md="15" controlId="validationCustom03">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      required
                      type="tel"
                      placeholder="09022222222"
                      pattern="[0-9]{3}[0-9]{4}[0-9]{4}"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <br />
                  </Form.Group>
                  <Form.Group as={Col} md="15" controlId="validationCustom04">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      rows={3}
                      placeholder="Enter a message "
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Form.Group>

                  <br />
                  {isFormValid ? (
                    <Form.Text style={{ color: "green" }}>
                      All Looks Good! We'll response soonest!{" "}
                    </Form.Text>
                  ) : null}

                  {/* <div className="col-12 pt-4 ms-2"> */}
                  <div className={styles.btnSubmit}>
                    <button className="btn btn-outline-warning" type="submit">
                      {isFormValid ? "Thank You" : "Submit "}
                    </button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card border="warning" className={styles.card}>
              {/* <Card.Img variant="top" src="holder.js/100px160" /> */}
              <Card.Body className={styles.contactFooter}>
                <Card.Link href="#info@exzing.com">info@exzing.com</Card.Link>
                <Card.Footer>
                  <SocialIcon url="https://www.linkedin.com/company/exzing/" />
                </Card.Footer>
                {/* <Card.Footer>
                  <SocialIcon url="https://twitter.com/okpoEkpenyong" />
                </Card.Footer> */}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};
