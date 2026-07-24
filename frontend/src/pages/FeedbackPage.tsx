// pages/FeedbackPage.tsx

import React, { useContext, useState, FormEvent } from "react";
import { SocialIcon } from "react-social-icons";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import { Card, Container, Row } from "react-bootstrap";
import { MessageContext } from "../context/MessageContext";
import styles from "../components/App.module.css";

interface StarRatingProps {
  rating: number;
  onChange: (value: number) => void;
}

function StarRating({ rating, onChange }: StarRatingProps) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            cursor: "pointer",
            fontSize: "1.75rem",
            color: star <= rating ? "#ffc107" : "#4a4a4a",
          }}
          role="button"
          aria-label={`${star} star`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export const FeedbackPage: React.FC = () => {
  const [validated, setValidated] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [consentPublic, setConsentPublic] = useState(false);

  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("FeedbackPage must be used within a MessageProvider");
  }
  const { submitFeedback, submitting, submitError } = context;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    const formValid = form.checkValidity();

    setValidated(true);
    setIsFormValid(formValid);

    if (formValid) {
	  console.log("Attempting submit with:", { fullName, email, phoneNumber, message, rating, consentPublic });	
      const success = await submitFeedback(
        fullName, email, phoneNumber, message, rating, consentPublic
      );
	  console.log("Submit result:", success);
      if (success) {
        setFullName("");
        setEmail("");
        setPhoneNumber("");
        setMessage("");
        setRating(0);
        setConsentPublic(false);
      }
    }
  };

  return (
    <div style={{ height: "100vh", overflowY: "auto" }}>
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
                  </Form.Group>

                  <Form.Group as={Col} md="15" controlId="ratingGroup">
                    <Form.Label>Rate your experience (optional)</Form.Label>
                    <StarRating rating={rating} onChange={setRating} />
                  </Form.Group>

                  <Form.Group as={Col} md="15" controlId="validationCustom04">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      rows={3}
                      placeholder="Enter a message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group as={Col} md="15" controlId="consentCheck" className="mt-2">
                    <Form.Check
                      type="checkbox"
                      label="I agree my feedback may be displayed publicly"
                      checked={consentPublic}
                      onChange={(e) => setConsentPublic(e.target.checked)}
                    />
                  </Form.Group>

                  {isFormValid && !submitting && !submitError && (
                    <Form.Text style={{ color: "green" }}>
                      All looks good! We'll respond soonest.
                    </Form.Text>
                  )}
                  {submitError && (
                    <Form.Text style={{ color: "red" }}>{submitError}</Form.Text>
                  )}

                  <div className={styles.btnSubmit}>
                    <button className="btn btn-outline-warning" type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : isFormValid ? "Thank You" : "Submit"}
                    </button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card border="warning" className={styles.card}>
              <Card.Body className={styles.contactFooter}>
                <Card.Link href="#info@exzing.com">info@exzing.com</Card.Link>
                <Card.Footer>
                  <SocialIcon url="https://www.linkedin.com/company/exzing/" />
                </Card.Footer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};