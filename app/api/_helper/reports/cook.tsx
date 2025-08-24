import { tw } from "@/lib/utils/pdf-utils";
import {
  Document,
  Font,
  Page,
  renderToBuffer,
  Text,
  View,
} from "@react-pdf/renderer";

// Register Anek Gujarati
Font.register({
  family: "Anek Gujarati",
  src: "https://fonts.gstatic.com/s/anekgujarati/v16/l7gKbj5oysqknvkCo2T_8FuiIRBA7lncQUmbIBEtPIKPSfmrXJN2JT4.woff2",
});

// Register Noto Sans
Font.register({
  family: "Noto Sans",
  src: "http://fonts.gstatic.com/s/notosans/v6/LeFlHvsZjXu2c3ZRgBq9nKCWcynf_cDxXwCLxiixG1c.ttf",
});

export const CookPdf = ({ data, columns }: { data: any[]; columns: any[] }) => {
  return (
    <Document>
      <Page style={tw("p-10 bg-background text-foreground")}>
        <View style={tw("p-6 bg-card rounded-lg")}>
          <Text style={[tw("text-primary text-2xl font-bold")]}>
            Tailwind config applied
          </Text>
          <Text
            style={[
              tw("text-primary text-2xl font-bold"),
              { fontFamily: "Anek Gujarati" },
            ]}
          >
            Tailwind config applied
          </Text>
          <Text
            style={[
              tw("text-primary text-2xl font-bold"),
              { fontFamily: "Noto Sans" },
            ]}
          >
            {JSON.stringify(data, null, 2)}
          </Text>
          <Text style={tw("mt-4 text-muted-foreground")}>
            Even rounded-lg and spacing- utilities work
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const cookPdfRenderToBuffer = async ({
  data,
  columns,
}: {
  data: any[];
  columns: any[];
}) => {
  return await renderToBuffer(<CookPdf data={data} columns={columns} />);
};
