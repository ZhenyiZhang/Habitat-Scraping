const kafka = require('kafka-node');

var kafkaClient = null;
var kafkaProducer = null;
var kafkaConsumer = null;

export function getClient() {
	if (kafkaClient === null) {
		kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
	}
	return kafkaClient;
}

export function getProducer() {
	if (kafkaProducer === null) {
		kafkaProducer = new kafka.Producer(getClient());
		kafkaProducer.on('ready', function() {
			console.log('Producer is ready');
		});

		kafkaProducer.on('error', function(err) {
			console.log('Producer is in error state');
			console.log(err);
		});
	}

	return kafkaProducer;
}

export function getConsumer() {
	if (kafkaConsumer === null) {
		kafkaConsumer = new kafka.Consumer(getClient(),
			[{ topic: 'Events', offset: 0 }],
			{
				autoCommit: false,
			},
		);

		kafkaConsumer.on('message', function(message) {
			console.log(message);
		});

		kafkaConsumer.on('error', function(err) {
			console.log('Error:', err);
		});

		kafkaConsumer.on('offsetOutOfRange', function(err) {
			console.log('offsetOutOfRange:', err);
		});
	}

	return kafkaConsumer;
}

export default { getClient, getProducer, getConsumer };





