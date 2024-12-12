import Head from "next/head";
import Header from "./components/Header";
import DepositForm from "./components/DepositForm";

export default function () {
  return (
    <div className="flex-col">
      <Head>
        <title>Income Trust</title>
        <meta name="description" content=" " />
      </Head>
      <Header />
      <DepositForm />
    </div>
  );
}
