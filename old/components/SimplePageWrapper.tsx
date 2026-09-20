import React from "react";
import Container, { Row } from "./utilities/layout/Container";

const SimplePageWrapper = (props: { title: String, children: any }) => {
    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <h2 className="headline">{props.title}</h2>
            </Row>
            <Row className="justify-content-md-center">
               {props.children}
            </Row>
        </Container>
    );
}

export default SimplePageWrapper;