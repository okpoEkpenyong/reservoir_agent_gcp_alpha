import ImageSlider from "../ImageSlider";

import rider_order from "../../images/rider_order.png";
import rider_cancelled from "../../images/rider_cancelled.png";
import rider_home from "../../images/rider_home.png";
import rider_search_dest from "../../images/rider_searchDest.png";
import rider_profile from "../../images/rider_profile.png";
import rider_ride_summary from "../../images/rider_ridesummary.png";
import xrpl_mint_nft from "../../images/xrpl-mint-nft.png";
import mint_carbonfp_xrpl from "../../images/mint-carbonfp-xrpl.png";

import Product from "../../_Product";

const App = () => {
  const slides = [
    { url: rider_home, title: "Home" },
    { url: rider_search_dest, title: "Search Destination" },
    { url: rider_order, title: "Order Ride" },
    { url: rider_cancelled, title: "Cancel Ride" },
    { url: rider_profile, title: "Rider Profile" },
    { url: rider_ride_summary, title: "Ride Summary" },
    // { url: xrpl_mint_nft, title: "XRPL Mint NFT" },
    { url: mint_carbonfp_xrpl, title: "XRPL Mint NFT" },
  ];
  const containerStyles = {
    width: "500px",
    height: "280px",
    margin: "0 auto",
  };
  const container = {
    flexDirection: "row",
    alignSelf: "center",
  };

  const inner = {
    borderColor: "#f9d29d",
    borderWidth: 4,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    paddingBottom: "10%",
  };

  const outer = {
    display: "flex",
    justifyContent: "center",
    borderColor: "white",
    paddingTop: 42,
    borderWidth: 4,
    borderRadius: 10,

    marginLeft: "5%",
  };

  return (
    <div>
      <div style={outer}>
        <div style={inner}>
          <iframe
            width="80%"
            height="90%"
            title="`YC Intro`"
            src="https://www.youtube.com/embed/ZxuGu63V7WY"
            allowFullScreen
          ></iframe>
          <div style={{ color: "white" }}>LushRide and XRPL Integration</div>
        </div>

        <div style={inner}>
          <iframe
            width="80%"
            height="90%"
            title="`YC Intro`"
            src="https://www.youtube.com/embed/eHuHLZx5Rio"
            allowFullScreen
          ></iframe>
          <div style={{ color: "white" }}>LushRide Demo (Web2)</div>
        </div>
      </div>

      {/* <h1>Product Screens</h1> */}
      <div style={containerStyles}>
        <ImageSlider slides={slides} />
      </div>
    </div>
  );
};

export default App;
