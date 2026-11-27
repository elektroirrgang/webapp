/* Speicher „SQL Server“ (Ziel auf dem Firmenserver). Eigene Datenbank, getrennt von SCC und Nexilo.
   Aufbau bewusst wie die Apps: eine Zeile je Datensatz (Datenart, ID, JSON), damit die Apps später 1:1 umziehen können.
   Häufig gesuchte Felder (Kunde, Baustelle, Datum) werden zusätzlich als berechnete Spalten mit Index geführt.
   Jede Änderung über MCP landet in dbo.mcp_protokoll. */
import sql from "mssql";
import { KONFIG } from "../konfig.js";

const sicher = s => /^[\w.-]{1,120}$/.test(String(s));
const SCHEMA = `
IF OBJECT_ID('dbo.datensatz') IS NULL
CREATE TABLE dbo.datensatz(
  art        NVARCHAR(40)  NOT NULL,
  id         NVARCHAR(120) NOT NULL,
  daten      NVARCHAR(MAX) NOT NULL CONSTRAINT ck_datensatz_json CHECK (ISJSON(daten)=1),
  aktualisiert BIGINT      NOT NULL,
  geloescht  BIT           NOT NULL CONSTRAINT df_datensatz_geloescht DEFAULT 0,
  kunde_id   AS CAST(JSON_VALUE(daten,'$.kundeId') AS NVARCHAR(120)),
  baustelle_id AS CAST(JSON_VALUE(daten,'$.baustelleId') AS NVARCHAR(120)),
  CONSTRAINT pk_datensatz PRIMARY KEY (art, id));
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_datensatz_kunde') CREATE INDEX ix_datensatz_kunde ON dbo.datensatz(art, kunde_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_datensatz_akt') CREATE INDEX ix_datensatz_akt ON dbo.datensatz(aktualisiert);
IF OBJECT_ID('dbo.mcp_protokoll') IS NULL
CREATE TABLE dbo.mcp_protokoll(
  nr BIGINT IDENTITY PRIMARY KEY, zeit DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  wer NVARCHAR(200) NOT NULL, quelle NVARCHAR(40) NOT NULL, werkzeug NVARCHAR(80) NOT NULL,
  art NVARCHAR(40) NULL, datensatz_id NVARCHAR(120) NULL, eingabe NVARCHAR(MAX) NULL);`;

export async function sqlSpeicher() {
  const s = KONFIG.sql;
  const pool = await new sql.ConnectionPool({
    server: s.server, database: s.datenbank, user: s.benutzer || undefined, password: s.passwort || undefined,
    options: { instanceName: s.instanz || undefined, encrypt: s.verschluesseln, trustServerCertificate: s.zertifikatVertrauen },
    pool: { max: 10 }
  }).connect();
  await pool.request().batch(SCHEMA);
  return {
    name: "sqlserver",
    async alle(art) {
      if (!sicher(art)) return [];
      const r = await pool.request().input("art", sql.NVarChar(40), art).query("SELECT daten FROM dbo.datensatz WHERE art=@art AND geloescht=0");
      return r.recordset.map(x => { try { return JSON.parse(x.daten); } catch { return null; } }).filter(Boolean);
    },
    async lesen(art, id) {
      if (!sicher(art) || !sicher(id)) return null;
      const r = await pool.request().input("art", sql.NVarChar(40), art).input("id", sql.NVarChar(120), id)
        .query("SELECT daten FROM dbo.datensatz WHERE art=@art AND id=@id AND geloescht=0");
      return r.recordset[0] ? JSON.parse(r.recordset[0].daten) : null;
    },
    async schreiben(art, rec) {
      if (!sicher(art) || !sicher(rec.id)) throw new Error("Ungültige Datenart oder ID");
      /* Neuere Fassung gewinnt – wie beim Abgleich der Apps */
      await pool.request().input("art", sql.NVarChar(40), art).input("id", sql.NVarChar(120), rec.id)
        .input("daten", sql.NVarChar(sql.MAX), JSON.stringify(rec)).input("akt", sql.BigInt, rec.updated || Date.now()).input("del", sql.Bit, rec.deleted ? 1 : 0)
        .query(`MERGE dbo.datensatz WITH (HOLDLOCK) AS z USING (SELECT @art art, @id id) AS q ON z.art=q.art AND z.id=q.id
          WHEN MATCHED AND z.aktualisiert<=@akt THEN UPDATE SET daten=@daten, aktualisiert=@akt, geloescht=@del
          WHEN NOT MATCHED THEN INSERT (art,id,daten,aktualisiert,geloescht) VALUES (@art,@id,@daten,@akt,@del);`);
      return rec;
    },
    async protokoll(e) {
      await pool.request().input("wer", sql.NVarChar(200), e.wer).input("quelle", sql.NVarChar(40), e.quelle).input("wz", sql.NVarChar(80), e.werkzeug)
        .input("art", sql.NVarChar(40), e.art || null).input("id", sql.NVarChar(120), e.id || null).input("ein", sql.NVarChar(sql.MAX), JSON.stringify(e.eingabe || {}))
        .query("INSERT INTO dbo.mcp_protokoll(wer,quelle,werkzeug,art,datensatz_id,eingabe) VALUES (@wer,@quelle,@wz,@art,@id,@ein)");
    }
  };
}
