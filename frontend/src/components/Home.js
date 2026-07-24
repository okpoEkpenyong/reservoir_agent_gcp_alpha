// src\components\Home.js

import React from "react";
import web from "../images/backg2.jpg";
import { Shared } from "./Shared";

export const Home = () => {
  return (
    <>
	<div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="gust-overlay"></div> {/* This adds the moving breeze */}
    <Shared
      name="Feel the Gust of Innovation"
      subtitle="From Subsurface AI Agents to Carbon Intelligence: Pioneering the Next Generation of Energy Tech"
      imgsrc={web}
      visit="/service"
      btname="Explore Our Solutions"
      path="home"
    />
	</div>
    </>
  );
};


