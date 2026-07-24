import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import styles from "./collapsible.module.css";
import logo from "../../images/exlogo9.jpeg";

export default function CollapsibleNavs() {
  return (
    <Container fluid className={styles.navcontainer}>
      <Navbar
        collapseOnSelect
        expand="lg"
        variant="dark"
        fixed="top"
        className={styles.custom_navbar2}
      >
        <Container>
          {/* <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand> */}
          <Nav.Link href="/" className="navbar-brand">
            <img
              src={logo}
              className={styles.navlogo}
              // className="d-inline-block align-top"
              alt="Exzing"
            />
          </Nav.Link>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/service" className="text-vsoft text-nav">
                Services
              </Nav.Link>
              <Nav.Link href="/product" className="text-vsoft">
                Products
              </Nav.Link>
              <Nav.Link href="/partners" className="text-vsoft">
                Partners
              </Nav.Link>
              <Nav.Link href="/about" className="text-vsoft">
                About
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link
                href="https://github.com/exzing"
                className="text-vsoft text-nav"
              >
                Github
              </Nav.Link>
              <Nav.Link href="/contact" className="text-vsoft">
                Contact Us
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </Container>
  );
}
