'use strict';

const assert = require( 'assert' );
const async = require( 'async' );
const testConfig = require( './lib/test.config' );
const testUtils = require( './lib/test.util' );

describe( 'setup', function () {

  before( function ( done ) {

    this.timeout( 60000 );

    testUtils.dockerStart( 'mysql', done );

  } );

  after( function ( done ) {

    this.timeout( 10000 );

    testUtils.dockerStop( done );

  } );

  it( 'should apply migrations', function ( done ) {

    this.timeout( 1000 );

    testConfig.restoreDefaultConfig();
    testConfig.defaultConfig.connections.mysql.setupDir = './test/umzug/mysql';
    testConfig.defaultConfig.connections.mysql.applyMigrations = true;

    testUtils.generateQueryTest( function ( component, done ) {

      async.waterfall( [
        ( done ) => {
          component.getConnection( 'mysql', done );
        },
        ( sequelize, done ) => {

          sequelize
            .query( 'SELECT * FROM stringstack_sequelize_test.SequelizeMeta;', {
              raw: true,
              type: sequelize.QueryTypes.SELECT
            } )
            .then( ( result ) => {

              try {

                assert( Array.isArray( result ), 'result should be an array' );
                assert.strictEqual( result.length, 2, 'result have 2 entries' );
                assert.deepStrictEqual( result, [
                  { name: '20180620225346-TICKET-001.js' },
                  { name: '20180622225506-TICKET-002.js' }
                ], 'result did not match expected result' );

              } catch ( e ) {
                return done( e );
              }

              done( null, sequelize );
            } )
            .catch( done );

        },
        ( sequelize, done ) => {

          sequelize
            .query( 'show tables;', {
              raw: true,
              type: sequelize.QueryTypes.SELECT
            } )
            .then( ( result ) => {

              try {

                assert( Array.isArray( result ), 'result should be an array' );
                assert.strictEqual( result.length, 3, 'result should have 3 entries' );
                assert.deepStrictEqual( result, [
                  { Tables_in_stringstack_sequelize_test: 'SequelizeMeta' },
                  { Tables_in_stringstack_sequelize_test: 'testOne' },
                  { Tables_in_stringstack_sequelize_test: 'testTwo' }
                ], 'result did not match expected result' );


              } catch ( e ) {
                return done( e );
              }

              done( null, sequelize );
            } )
            .catch( done );

        }
      ], done );

    }, done );

  } );

  it( 'should load models', function ( done ) {

    this.timeout( 1000 );

    testConfig.restoreDefaultConfig();
    testConfig.defaultConfig.connections.mysql.setupDir = './test/umzug/mysql';
    testConfig.defaultConfig.connections.mysql.applyMigrations = true;

    testUtils.generateQueryTest( function ( component, done ) {

      async.waterfall( [
        ( done ) => {
          component.getConnection( 'mysql', done );
        },
        ( sequelize, done ) => {

          try {

            assert( !!sequelize.models.testOne, 'should have a testOne model' );
            assert( !!sequelize.models.testTwo, 'should have a testTwo model' );
            assert( !sequelize.models.testThree, 'should not have a testThree model' );

          } catch ( e ) {
            return done( e );
          }

          done();

        }
      ], done );

    }, done );

  } );

} );