using System.Collections.Generic;
using Miningcore;
using Newtonsoft.Json;

namespace WebApp;

public class AppConfig
{
	public class EmailSenderConfig
	{
		public string ServerAddress { get; set; }
		public int ServerPort { get; set; }
		public string Username { get; set; }
		public string Password { get; set; }
	}

	public class MinerDownloadConfig
	{
		public string XmrigLinux { get; set; }
		public string XmrigWindows { get; set; }

		public string TRexWindows { get; set; }
		public string TRexLinux { get; set; }

		public string WildrigWindows { get; set; }
		public string WildrigLinux { get; set; }

		public string EwbfWindows { get; set; }
		public string EwbfLinux { get; set; }

		public string LolMinerWindows { get; set; }
		public string LolMinerLinux { get; set; }

		public string SRBMinerWindows { get; set; }
		public string SRBMinerLinux { get; set; }

		public string CryptoDredgeWindows { get; set; }
		public string CryptoDredgeLinux { get; set; }

		public string EthminerWindows { get; set; }
		public string EthminerLinux { get; set; }

		public string GMinerWindows { get; set; }
		public string GMinerLinux { get; set; }

		public string CCMinerWindows { get; set; }
		public string CCMinerLinux { get; set; }
	}

	public EmailSenderConfig EmailSender { get; set; }

	/// <summary>
	/// Miningcore API Endpoint (displayed at pool startup)
	/// </summary>
	public string MiningcoreApiEndpoint { get; set; }
	
	/// <summary>
	/// Webserver listen port
	/// </summary>
	public int ListenPort { get; set; }

	/// <summary>
	/// Miner Download configs
	/// </summary>
	public MinerDownloadConfig Miners { get; set; }

	public string SupportEmail { get; set; }
	public string TwitterUrl { get; set; }
	public string PoolDomain { get; set; }

  public string[] StratumHosts { get; set; }
}
